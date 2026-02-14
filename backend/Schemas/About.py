from pydantic import BaseModel
from typing import List,Optional
from backend.Schemas.Feature import Feature


class AboutContent(BaseModel):
    founded_year: str
    club_name: str
    member_count: str
    activities: str
    features: List[Feature]
    image_url: Optional[str] = None