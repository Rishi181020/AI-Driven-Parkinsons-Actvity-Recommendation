from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    display_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Baseline(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    tremor_1to5: int
    sleep_hours: int
    sleep_minutes: int
    mood_1to5: int
    med_last_taken_minutes_ago: int

class MetricsEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    ts: datetime
    hr_bpm: float
    hrv_rmssd_ms: float
    steps_last_5m: int
    sleep_last_night_min: int
    tremor_index: float

class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    activity_id: str
    duration_sec: int
    helped: bool
    tremor_after_1to5: int
    mood_after_1to5: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BanditStat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    activity_id: str
    n: int = 0
    success_n: int = 0