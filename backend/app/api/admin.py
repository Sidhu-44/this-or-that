from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta
from app.database import get_db
from app.config import settings
from app.timezone_utils import get_current_ist_date
from app.models import DailyPoll
from app.crud import (
    get_all_polls_admin,
    get_poll_by_id,
    get_poll_by_date,
    create_poll,
    update_poll,
    delete_poll,
    get_poll_stats
)
from app.schemas import (
    PollCreate,
    PollUpdate,
    PollResponse,
    ArchivePollItem
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

def require_admin_auth(x_admin_key: Optional[str] = Header(None)):
    if not x_admin_key or x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Admin API Key"
        )
    return True

@router.get("/verify")
def verify_admin(authorized: bool = Depends(require_admin_auth)):
    return {"status": "authenticated", "message": "Admin credentials valid"}

@router.get("/polls", response_model=List[ArchivePollItem])
def list_admin_polls(
    db: Session = Depends(get_db),
    authorized: bool = Depends(require_admin_auth)
):
    polls = get_all_polls_admin(db)
    result = []
    for poll in polls:
        stats = get_poll_stats(db, poll.id)
        result.append(ArchivePollItem(
            id=poll.id,
            question=poll.question,
            option_a_label=poll.option_a_label,
            option_a_image_url=poll.option_a_image_url,
            option_b_label=poll.option_b_label,
            option_b_image_url=poll.option_b_image_url,
            scheduled_date=poll.scheduled_date,
            total_votes=stats.total_votes,
            votes_a=stats.votes_a,
            votes_b=stats.votes_b,
            percentage_a=stats.percentage_a,
            percentage_b=stats.percentage_b
        ))
    return result

@router.post("/polls", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
def create_admin_poll(
    poll_in: PollCreate,
    db: Session = Depends(get_db),
    authorized: bool = Depends(require_admin_auth)
):
    existing = get_poll_by_date(db, poll_in.scheduled_date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A poll is already scheduled for date {poll_in.scheduled_date}. Each IST calendar day can only have one featured poll."
        )

    poll = create_poll(db, poll_in)
    return PollResponse.model_validate(poll)

@router.put("/polls/{poll_id}", response_model=PollResponse)
def update_admin_poll(
    poll_id: int,
    poll_in: PollUpdate,
    db: Session = Depends(get_db),
    authorized: bool = Depends(require_admin_auth)
):
    poll = get_poll_by_id(db, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    if poll_in.scheduled_date and poll_in.scheduled_date != poll.scheduled_date:
        existing = get_poll_by_date(db, poll_in.scheduled_date)
        if existing and existing.id != poll.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another poll is already scheduled for date {poll_in.scheduled_date}."
            )

    updated = update_poll(db, poll, poll_in)
    return PollResponse.model_validate(updated)

@router.delete("/polls/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_poll(
    poll_id: int,
    db: Session = Depends(get_db),
    authorized: bool = Depends(require_admin_auth)
):
    poll = get_poll_by_id(db, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    delete_poll(db, poll)
    return None

@router.post("/seed")
def seed_sample_data(
    db: Session = Depends(get_db),
    authorized: bool = Depends(require_admin_auth)
):
    from seed import seed_polls
    count = seed_polls(db)
    return {"message": f"Successfully seeded {count} sample polls for the week"}
