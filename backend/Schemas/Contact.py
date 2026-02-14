
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
class ContactInfo(BaseModel):
    email: EmailStr
    phone: str
    address: str

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str
    created_at: Optional[datetime] = None

class ContactReply(BaseModel):
    email: EmailStr
    query:str
    message: str
