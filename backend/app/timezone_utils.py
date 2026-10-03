from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo
from app.config import settings

def get_ist_timezone() -> ZoneInfo:
    return ZoneInfo(settings.APP_TIMEZONE)

def get_ist_now() -> datetime:
    """Returns current datetime in IST (Asia/Kolkata)."""
    return datetime.now(get_ist_timezone())

def get_current_ist_date() -> date:
    """Returns current calendar date in IST."""
    return get_ist_now().date()

def get_seconds_until_next_ist_midnight() -> int:
    """Returns seconds remaining until next 12:00 AM IST."""
    now = get_ist_now()
    tomorrow = now.date() + timedelta(days=1)
    next_midnight = datetime.combine(tomorrow, time.min, tzinfo=get_ist_timezone())
    diff = int((next_midnight - now).total_seconds())
    return max(0, diff)
