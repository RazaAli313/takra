from pydantic import BaseModel, HttpUrl
from typing import Optional
class SocialLinks(BaseModel):
    linkedin: Optional[HttpUrl] = None
    github: Optional[HttpUrl] = None
    twitter: Optional[HttpUrl] = None