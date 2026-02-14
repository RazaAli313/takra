"""Taakra - Competition schema (extends Event for competition-specific fields)."""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class CompetitionBase(BaseModel):
    title: str
    date: str
    time: str
    location: str
    description: str
    image_url: Optional[str] = None
    registration_open: bool = True
    # Taakra-specific
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    rules: Optional[str] = None
    prizes: Optional[str] = None
    deadline: Optional[str] = None  # registration deadline
    modules: Optional[List[str]] = []
    module_amounts: Optional[Dict[str, int]] = {}
    discount_codes: Optional[List[Dict]] = []


class CompetitionInDB(CompetitionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    registration_count: Optional[int] = 0  # populated when listing
