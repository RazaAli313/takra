from typing import Optional
from pydantic import BaseModel


class BannerItem(BaseModel):
    id: str
    text: str
    link: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str

