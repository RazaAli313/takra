from typing import Optional
from pydantic import BaseModel


class FAQItem(BaseModel):
    id: str
    question: str
    answer: str
    category: Optional[str] = "General"
    order: int = 0
    is_active: bool = True
    created_at: str
    updated_at: str

