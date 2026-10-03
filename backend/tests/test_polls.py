import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.config import settings
from app.timezone_utils import (
    get_ist_now,
    get_current_ist_date,
    get_seconds_until_next_ist_midnight
)
from app.models import DailyPoll, Vote

# Setup in-memory SQLite database for isolated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_ist_timezone_calculation():
    """Verify IST timezone conversion and midnight countdown logic."""
    now_ist = get_ist_now()
    # UTC offset for Asia/Kolkata is +05:30
    assert now_ist.utcoffset() == timedelta(hours=5, minutes=30)

    ist_date = get_current_ist_date()
    assert ist_date is not None

    seconds = get_seconds_until_next_ist_midnight()
    assert 0 <= seconds <= 86400

def test_today_poll_fallback_when_empty(client):
    """When no poll is scheduled for today, return a friendly response instead of crashing."""
    res = client.get("/api/polls/today")
    assert res.status_code == 200
    data = res.json()
    assert data["poll"] is None
    assert data["stats"] is None
    assert data["has_voted"] is False
    assert data["is_today"] is True
    assert data["countdown_seconds"] > 0

def test_admin_auth_and_poll_creation(client):
    """Verify admin auth checks and duplicate date prevention."""
    today = get_current_ist_date()
    payload = {
        "question": "Coffee or Tea?",
        "option_a_label": "Espresso",
        "option_a_image_url": "https://example.com/coffee.jpg",
        "option_b_label": "Matcha",
        "option_b_image_url": "https://example.com/matcha.jpg",
        "scheduled_date": str(today)
    }

    # Missing admin key -> 401
    res = client.post("/api/admin/polls", json=payload)
    assert res.status_code == 401

    # Wrong admin key -> 401
    res = client.post("/api/admin/polls", json=payload, headers={"X-Admin-Key": "wrong-key"})
    assert res.status_code == 401

    # Valid key -> 201
    res = client.post("/api/admin/polls", json=payload, headers={"X-Admin-Key": settings.ADMIN_API_KEY})
    assert res.status_code == 201
    created_id = res.json()["id"]
    assert created_id > 0

    # Attempting to schedule another poll on the same date -> 400
    res_dup = client.post("/api/admin/polls", json=payload, headers={"X-Admin-Key": settings.ADMIN_API_KEY})
    assert res_dup.status_code == 400
    assert "already scheduled" in res_dup.json()["detail"]

def test_today_poll_hides_stats_before_voting(client):
    """Before voting, poll stats (percentages and counts) must be hidden."""
    today = get_current_ist_date()
    payload = {
        "question": "iOS or Android?",
        "option_a_label": "iOS",
        "option_a_image_url": "https://example.com/ios.jpg",
        "option_b_label": "Android",
        "option_b_image_url": "https://example.com/android.jpg",
        "scheduled_date": str(today)
    }
    client.post("/api/admin/polls", json=payload, headers={"X-Admin-Key": settings.ADMIN_API_KEY})

    # Poll request without prior vote
    res = client.get("/api/polls/today?voter_id=anonymous_tester_1")
    assert res.status_code == 200
    data = res.json()
    assert data["poll"]["question"] == "iOS or Android?"
    assert data["has_voted"] is False
    assert data["stats"] is None  # Stats remain hidden!

def test_voting_flow_and_duplicate_rejection(client):
    """Test vote submission, instant percentage calculation, and duplicate vote rejection."""
    today = get_current_ist_date()
    payload = {
        "question": "Dark Mode or Light Mode?",
        "option_a_label": "Dark Mode",
        "option_a_image_url": "https://example.com/dark.jpg",
        "option_b_label": "Light Mode",
        "option_b_image_url": "https://example.com/light.jpg",
        "scheduled_date": str(today)
    }
    created = client.post("/api/admin/polls", json=payload, headers={"X-Admin-Key": settings.ADMIN_API_KEY}).json()
    poll_id = created["id"]

    # 1. First voter votes for Option A
    voter_1 = "voter_uuid_111"
    res1 = client.post(
        f"/api/polls/{poll_id}/vote",
        json={"option_selected": "A"},
        headers={"X-Voter-ID": voter_1}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["option_selected"] == "A"
    assert data1["stats"]["total_votes"] == 1
    assert data1["stats"]["votes_a"] == 1
    assert data1["stats"]["votes_b"] == 0
    assert data1["stats"]["percentage_a"] == 100.0
    assert data1["stats"]["percentage_b"] == 0.0

    # 2. Voter 1 attempts to vote again -> 409 Conflict
    res_dup = client.post(
        f"/api/polls/{poll_id}/vote",
        json={"option_selected": "B"},
        headers={"X-Voter-ID": voter_1}
    )
    assert res_dup.status_code == 409
    assert "already voted" in res_dup.json()["detail"]

    # 3. Voter 2 votes for Option B
    voter_2 = "voter_uuid_222"
    res2 = client.post(
        f"/api/polls/{poll_id}/vote",
        json={"option_selected": "B"},
        headers={"X-Voter-ID": voter_2}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["stats"]["total_votes"] == 2
    assert data2["stats"]["votes_a"] == 1
    assert data2["stats"]["votes_b"] == 1
    assert data2["stats"]["percentage_a"] == 50.0
    assert data2["stats"]["percentage_b"] == 50.0

    # 4. Fetching today's poll for voter 1 now includes stats and user_vote
    res_poll_voter1 = client.get(f"/api/polls/today?voter_id={voter_1}")
    assert res_poll_voter1.status_code == 200
    p1_data = res_poll_voter1.json()
    assert p1_data["has_voted"] is True
    assert p1_data["user_vote"] == "A"
    assert p1_data["stats"]["total_votes"] == 2

def test_archive_filtering_and_read_only(client):
    """Archived polls must only include past dates and allow read-only results viewing."""
    today = get_current_ist_date()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    # Create yesterday poll
    client.post("/api/admin/polls", json={
        "question": "Past Question",
        "option_a_label": "Left",
        "option_a_image_url": "https://example.com/left.jpg",
        "option_b_label": "Right",
        "option_b_image_url": "https://example.com/right.jpg",
        "scheduled_date": str(yesterday)
    }, headers={"X-Admin-Key": settings.ADMIN_API_KEY})

    # Create today poll
    client.post("/api/admin/polls", json={
        "question": "Today Question",
        "option_a_label": "Up",
        "option_a_image_url": "https://example.com/up.jpg",
        "option_b_label": "Down",
        "option_b_image_url": "https://example.com/down.jpg",
        "scheduled_date": str(today)
    }, headers={"X-Admin-Key": settings.ADMIN_API_KEY})

    # Create tomorrow poll
    client.post("/api/admin/polls", json={
        "question": "Future Question",
        "option_a_label": "Inside",
        "option_a_image_url": "https://example.com/inside.jpg",
        "option_b_label": "Outside",
        "option_b_image_url": "https://example.com/outside.jpg",
        "scheduled_date": str(tomorrow)
    }, headers={"X-Admin-Key": settings.ADMIN_API_KEY})

    # Archive query should return ONLY yesterday
    archive_res = client.get("/api/polls/archive")
    assert archive_res.status_code == 200
    archive_list = archive_res.json()
    assert len(archive_list) == 1
    assert archive_list[0]["question"] == "Past Question"

    past_poll_id = archive_list[0]["id"]

    # In archive, stats are visible even without voting
    detail_res = client.get(f"/api/polls/{past_poll_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["is_archived"] is True
    assert detail_res.json()["stats"] is not None

    # Voting on past poll is rejected
    vote_res = client.post(
        f"/api/polls/{past_poll_id}/vote",
        json={"option_selected": "A"},
        headers={"X-Voter-ID": "tester_late"}
    )
    assert vote_res.status_code == 400
    assert "closed" in vote_res.json()["detail"]
