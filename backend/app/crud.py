from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional, List
from app.models import DailyPoll, Vote
from app.schemas import PollCreate, PollUpdate, PollStats, ArchivePollItem

def calculate_stats(total_votes: int, votes_a: int, votes_b: int) -> PollStats:
    if total_votes == 0:
        return PollStats(
            total_votes=0,
            votes_a=0,
            votes_b=0,
            percentage_a=0.0,
            percentage_b=0.0
        )
    pct_a = round((votes_a / total_votes) * 100, 1)
    # Ensure percentages cleanly balance or represent exact ratio
    pct_b = round(100.0 - pct_a, 1) if (votes_a + votes_b == total_votes) else round((votes_b / total_votes) * 100, 1)
    return PollStats(
        total_votes=total_votes,
        votes_a=votes_a,
        votes_b=votes_b,
        percentage_a=pct_a,
        percentage_b=pct_b
    )

def get_poll_stats(db: Session, poll_id: int) -> PollStats:
    votes = db.query(Vote.option_selected, func.count(Vote.id)).filter(Vote.poll_id == poll_id).group_by(Vote.option_selected).all()
    votes_map = {opt: count for opt, count in votes}
    votes_a = votes_map.get("A", 0)
    votes_b = votes_map.get("B", 0)
    total_votes = votes_a + votes_b
    return calculate_stats(total_votes, votes_a, votes_b)

def get_poll_by_date(db: Session, poll_date: date) -> Optional[DailyPoll]:
    return db.query(DailyPoll).filter(DailyPoll.scheduled_date == poll_date).first()

def get_poll_by_id(db: Session, poll_id: int) -> Optional[DailyPoll]:
    return db.query(DailyPoll).filter(DailyPoll.id == poll_id).first()

def get_user_vote(db: Session, poll_id: int, voter_id: str) -> Optional[Vote]:
    if not voter_id:
        return None
    return db.query(Vote).filter(Vote.poll_id == poll_id, Vote.voter_id == voter_id).first()

def create_vote(db: Session, poll_id: int, voter_id: str, option_selected: str) -> Vote:
    vote = Vote(
        poll_id=poll_id,
        voter_id=voter_id,
        option_selected=option_selected
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)
    return vote

def get_archive_polls(db: Session, before_date: date) -> List[ArchivePollItem]:
    polls = db.query(DailyPoll).filter(DailyPoll.scheduled_date < before_date).order_by(DailyPoll.scheduled_date.desc()).all()
    results = []
    for poll in polls:
        stats = get_poll_stats(db, poll.id)
        results.append(ArchivePollItem(
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
    return results

def get_all_polls_admin(db: Session) -> List[DailyPoll]:
    return db.query(DailyPoll).order_by(DailyPoll.scheduled_date.desc()).all()

def create_poll(db: Session, poll_data: PollCreate) -> DailyPoll:
    poll = DailyPoll(
        question=poll_data.question,
        option_a_label=poll_data.option_a_label,
        option_a_image_url=poll_data.option_a_image_url,
        option_b_label=poll_data.option_b_label,
        option_b_image_url=poll_data.option_b_image_url,
        scheduled_date=poll_data.scheduled_date
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)
    return poll

def update_poll(db: Session, poll: DailyPoll, poll_data: PollUpdate) -> DailyPoll:
    update_data = poll_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(poll, key, value)
    db.commit()
    db.refresh(poll)
    return poll

def delete_poll(db: Session, poll: DailyPoll) -> None:
    db.delete(poll)
    db.commit()
