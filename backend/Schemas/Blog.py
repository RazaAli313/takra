from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BlogPostBase(BaseModel):
    title: str
    excerpt: str
    author: str
    content:str
    read_time: str

class BlogPostCreate(BlogPostBase):
    pass

class BlogPostInDB(BlogPostBase):
    id: str
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    likes: Optional[int] = 0