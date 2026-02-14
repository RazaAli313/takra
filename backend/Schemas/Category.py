"""Taakra - Category schema for competitions."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryInDB(CategoryBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
