from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AchievementBase(BaseModel):
    year: str = Field(..., min_length=4, max_length=4)
    month: Optional[str] = Field(None, max_length=20)
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    icon: str = Field(..., pattern="^(TrophyIcon|StarIcon|AcademicCapIcon)$")
    image_url: str = Field(default=None)

class AchievementCreate(AchievementBase):
    pass

class Achievement(AchievementBase):
    id: str
    created_at: datetime
    updated_at: datetime