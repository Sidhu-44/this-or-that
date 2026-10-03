from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class DailyPoll(Base):
    __tablename__ = "daily_polls"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(300), nullable=False)
    option_a_label = Column(String(100), nullable=False)
    option_a_image_url = Column(Text, nullable=False)
    option_b_label = Column(String(100), nullable=False)
    option_b_image_url = Column(Text, nullable=False)
    scheduled_date = Column(Date, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    votes = relationship("Vote", back_populates="poll", cascade="all, delete-orphan")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("daily_polls.id", ondelete="CASCADE"), nullable=False, index=True)
    option_selected = Column(String(1), nullable=False)  # 'A' or 'B'
    voter_id = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    poll = relationship("DailyPoll", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("poll_id", "voter_id", name="uq_poll_voter"),
    )
