from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class DelegationCreate(BaseModel):
    name: str
    cnic: str
    email: EmailStr
    phone: str
    batch: str
    campus: str
    why_join: str
    comments: Optional[str] = None


class DelegationInDB(DelegationCreate):
    id: str
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    created_at: Optional[datetime] = None
