from typing import List, Optional
from pydantic import BaseModel


class ContentItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    url: str
    thumbnail: Optional[str] = None
    date: str