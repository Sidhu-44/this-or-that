from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from app.database import get_db
from app.timezone_utils import get_current_ist_date, get_seconds_until_next_ist_midnight
from app.crud import (
    get_poll_by_date,
    get_poll_by_id,
    get_poll_stats,
    get_user_vote,
    create_vote,
    get_archive_polls
)
from app.schemas import (
    DailyPollResponse,
    PollResponse,
    VoteRequest,
    VoteResponse,
    ArchivePollItem
)

router = APIRouter(prefix="/api/polls", tags=["polls"])

def resolve_voter_id(x_voter_id: Optional[str] = Header(None), voter_id: Optional[str] = Query(None)) -> Optional[str]:
    return x_voter_id or voter_id

@router.get("/today", response_model=DailyPollResponse)
def get_today_poll(
    voter_id: Optional[str] = Depends(resolve_voter_id),
    db: Session = Depends(get_db)
):
    today_ist = get_current_ist_date()
    countdown = get_seconds_until_next_ist_midnight()
    poll = get_poll_by_date(db, today_ist)

    if not poll:
        return DailyPollResponse(
            poll=None,
            stats=None,
            has_voted=False,
            user_vote=None,
            countdown_seconds=countdown,
            current_ist_date=today_ist,
            is_today=True,
            is_archived=False
        )

    user_vote_record = get_user_vote(db, poll.id, voter_id) if voter_id else None
    has_voted = user_vote_record is not None
    user_vote = user_vote_record.option_selected if user_vote_record else None

    # Percentages and vote counts are only revealed after voting
    stats = get_poll_stats(db, poll.id) if has_voted else None

    return DailyPollResponse(
        poll=PollResponse.model_validate(poll),
        stats=stats,
        has_voted=has_voted,
        user_vote=user_vote,
        countdown_seconds=countdown,
        current_ist_date=today_ist,
        is_today=True,
        is_archived=False
    )

@router.get("/archive", response_model=List[ArchivePollItem])
def get_archive(db: Session = Depends(get_db)):
    today_ist = get_current_ist_date()
    return get_archive_polls(db, before_date=today_ist)

@router.get("/{poll_id}", response_model=DailyPollResponse)
def get_poll_by_id_endpoint(
    poll_id: int,
    voter_id: Optional[str] = Depends(resolve_voter_id),
    db: Session = Depends(get_db)
):
    today_ist = get_current_ist_date()
    countdown = get_seconds_until_next_ist_midnight()
    poll = get_poll_by_id(db, poll_id)

    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    is_today = (poll.scheduled_date == today_ist)
    is_archived = (poll.scheduled_date < today_ist)

    # Future polls shouldn't be accessible publicly
    if poll.scheduled_date > today_ist:
        raise HTTPException(status_code=404, detail="Poll not found or not yet published")

    user_vote_record = get_user_vote(db, poll.id, voter_id) if voter_id else None
    has_voted = user_vote_record is not None
    user_vote = user_vote_record.option_selected if user_vote_record else None

    # In archive, stats are always visible because voting is closed. For today, visible only if user voted.
    show_stats = is_archived or has_voted
    stats = get_poll_stats(db, poll.id) if show_stats else None

    return DailyPollResponse(
        poll=PollResponse.model_validate(poll),
        stats=stats,
        has_voted=has_voted,
        user_vote=user_vote,
        countdown_seconds=countdown,
        current_ist_date=today_ist,
        is_today=is_today,
        is_archived=is_archived
    )

@router.post("/{poll_id}/vote", response_model=VoteResponse)
def cast_vote(
    poll_id: int,
    vote_data: VoteRequest,
    voter_id: Optional[str] = Depends(resolve_voter_id),
    db: Session = Depends(get_db)
):
    if not voter_id or not voter_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voter session identifier (voter_id) is required to vote"
        )

    clean_voter_id = voter_id.strip()
    today_ist = get_current_ist_date()
    poll = get_poll_by_id(db, poll_id)

    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    # Voting is only allowed on the active daily poll
    if poll.scheduled_date < today_ist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voting for this poll has closed. It is now archived."
        )
    if poll.scheduled_date > today_ist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This poll is scheduled for a future date and is not yet active."
        )

    # Pre-check if already voted
    existing_vote = get_user_vote(db, poll.id, clean_voter_id)
    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already voted on this poll."
        )

    # Perform atomic insert with database constraint handling
    try:
        create_vote(
            db=db,
            poll_id=poll.id,
            voter_id=clean_voter_id,
            option_selected=vote_data.option_selected
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already voted on this poll."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while saving your vote: {str(e)}"
        )

    stats = get_poll_stats(db, poll.id)
    return VoteResponse(
        message="Vote recorded successfully",
        option_selected=vote_data.option_selected,
        stats=stats
    )
