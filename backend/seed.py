from datetime import timedelta
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import DailyPoll, Vote
from app.timezone_utils import get_current_ist_date

SAMPLE_POLLS = [
    {
        "offset": -3,
        "question": "Where would you rather spend a week unwinding?",
        "option_a_label": "Tropical Beach Resort",
        "option_a_image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Cozy Mountain Cabin",
        "option_b_image_url": "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 142,
        "votes_b": 118
    },
    {
        "offset": -2,
        "question": "What fuels your morning best?",
        "option_a_label": "Artisanal Espresso",
        "option_a_image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Spiced Masala Chai",
        "option_b_image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 89,
        "votes_b": 210
    },
    {
        "offset": -1,
        "question": "The eternal pet showdown — who has your heart?",
        "option_a_label": "Loyal Golden Pup",
        "option_a_image_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Charming Cat",
        "option_b_image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 312,
        "votes_b": 278
    },
    {
        "offset": 0,  # TODAY
        "question": "Which superpower would you instantly choose?",
        "option_a_label": "Flight Over The Clouds",
        "option_a_image_url": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Time Travel Across Eras",
        "option_b_image_url": "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 45,
        "votes_b": 72
    },
    {
        "offset": 1,
        "question": "How do you prefer to experience storytelling?",
        "option_a_label": "Immersive Hardcover Book",
        "option_a_image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Cinematic Film Experience",
        "option_b_image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 0,
        "votes_b": 0
    },
    {
        "offset": 2,
        "question": "Working environment — which sparks your best focus?",
        "option_a_label": "Bustling Urban Café",
        "option_a_image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Minimalist Home Sanctuary",
        "option_b_image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 0,
        "votes_b": 0
    },
    {
        "offset": 3,
        "question": "When does your creativity truly peak?",
        "option_a_label": "Crisp Sunrise Morning",
        "option_a_image_url": "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1000&q=80",
        "option_b_label": "Quiet Midnight Hours",
        "option_b_image_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80",
        "votes_a": 0,
        "votes_b": 0
    }
]

def seed_polls(db: Session = None) -> int:
    own_session = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        own_session = True

    try:
        today_ist = get_current_ist_date()
        created_count = 0

        for item in SAMPLE_POLLS:
            poll_date = today_ist + timedelta(days=item["offset"])
            existing = db.query(DailyPoll).filter(DailyPoll.scheduled_date == poll_date).first()

            if not existing:
                poll = DailyPoll(
                    question=item["question"],
                    option_a_label=item["option_a_label"],
                    option_a_image_url=item["option_a_image_url"],
                    option_b_label=item["option_b_label"],
                    option_b_image_url=item["option_b_image_url"],
                    scheduled_date=poll_date
                )
                db.add(poll)
                db.flush()

                # Add sample votes if specified
                votes_a = item.get("votes_a", 0)
                votes_b = item.get("votes_b", 0)

                for i in range(votes_a):
                    db.add(Vote(
                        poll_id=poll.id,
                        option_selected="A",
                        voter_id=f"seed_voter_a_{poll.id}_{i}"
                    ))
                for j in range(votes_b):
                    db.add(Vote(
                        poll_id=poll.id,
                        option_selected="B",
                        voter_id=f"seed_voter_b_{poll.id}_{j}"
                    ))

                created_count += 1

        db.commit()
        return created_count
    finally:
        if own_session:
            db.close()

if __name__ == "__main__":
    count = seed_polls()
    print(f"Successfully seeded {count} sample polls!")
