
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime


class EventBase(BaseModel):
    title: str
    date: str
    time: str
    location: str
    description: str
    image_url: Optional[str] = None
    registration_open: bool = True
    modules: Optional[List[str]] = []  # modules/competitions
    module_amounts: Optional[Dict[str, int]] = {}  # module name to amount
    discount_codes: Optional[List[Dict[str, str]]] = []  # [{code, amount, module}]


class EventCreate(EventBase):
    pass


class EventInDB(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime


# Team member model
class TeamMember(BaseModel):
    name: str
    email: EmailStr
    phone: str
    university_name: str
    university_roll_no: str
    batch: str

class EventRegistration(BaseModel):
    team_name: str
    members: List[TeamMember]  # 1 mandatory, 2 optional
    modules: List[str] = []
    created_at: Optional[datetime] = None
    payment_receipt_url: Optional[str] = None
    payment_status: str = "pending"  # pending, submitted, verified, rejected
    transaction_id: Optional[str] = None
    payment_submitted_at: Optional[datetime] = None
    discount_codes_used: Optional[List[Dict[str, str]]] = None  # [{ "module", "code" }] used at registration


# Payment-related models
class PaymentReceipt(BaseModel):
    transaction_id: str
    team_name: str
    module: str
    created_at: Optional[datetime] = None

# Response model for payment submission
class PaymentResponse(BaseModel):
    message: str
    receipt_url: str
    transaction_id: str