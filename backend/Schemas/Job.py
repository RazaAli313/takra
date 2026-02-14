from typing import Optional, List
from pydantic import BaseModel


class JobItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    type: str  # Full-time, Part-time, Internship, Contract
    description: str
    requirements: Optional[str] = None
    salary: Optional[str] = None
    apply_link: Optional[str] = None
    posted_date: str
    deadline: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str

