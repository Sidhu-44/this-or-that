from pydantic import BaseModel, HttpUrl, Field, field_validator, ConfigDict
from typing import Optional, Literal
from datetime import date, datetime

class PollBase(BaseModel):
    question: str = Field(..., min_length=3, max_length=300, description="The main question for the poll")
    option_a_label: str = Field(..., min_length=1, max_length=100, description="Label for Option A")
    option_a_image_url: str = Field(..., min_length=5, description="Image URL for Option A")
    option_b_label: str = Field(..., min_length=1, max_length=100, description="Label for Option B")
    option_b_image_url: str = Field(..., min_length=5, description="Image URL for Option B")
    scheduled_date: date = Field(..., description="Scheduled date for this poll in IST (YYYY-MM-DD)")

    @field_validator("option_a_image_url", "option_b_image_url")
    @classmethod
    def validate_image_url(cls, v: str) -> str:
        v_str = str(v).strip()
        if not (v_str.startswith("http://") or v_str.startswith("https://") or v_str.startswith("data:image/")):
            raise ValueError("Image URL must start with http:// or https://")
        return v_str

class PollCreate(PollBase):
    pass

class PollUpdate(BaseModel):
    question: Optional[str] = Field(None, min_length=3, max_length=300)
    option_a_label: Optional[str] = Field(None, min_length=1, max_length=100)
    option_a_image_url: Optional[str] = None
    option_b_label: Optional[str] = Field(None, min_length=1, max_length=100)
    option_b_image_url: Optional[str] = None
    scheduled_date: Optional[date] = None

    @field_validator("option_a_image_url", "option_b_image_url")
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_str = str(v).strip()
        if not (v_str.startswith("http://") or v_str.startswith("https://") or v_str.startswith("data:image/")):
            raise ValueError("Image URL must start with http:// or https://")
        return v_str

class PollResponse(PollBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PollStats(BaseModel):
    total_votes: int
    votes_a: int
    votes_b: int
    percentage_a: float
    percentage_b: float

class DailyPollResponse(BaseModel):
    poll: Optional[PollResponse] = None
    stats: Optional[PollStats] = None
    has_voted: bool = False
    user_vote: Optional[str] = None
    countdown_seconds: int
    current_ist_date: date
    is_today: bool = True
    is_archived: bool = False

class VoteRequest(BaseModel):
    option_selected: Literal['A', 'B']

class VoteResponse(BaseModel):
    message: str
    option_selected: str
    stats: PollStats

class ArchivePollItem(BaseModel):
    id: int
    question: str
    option_a_label: str
    option_a_image_url: str
    option_b_label: str
    option_b_image_url: str
    scheduled_date: date
    total_votes: int
    votes_a: int
    votes_b: int
    percentage_a: float
    percentage_b: float

    model_config = ConfigDict(from_attributes=True)
