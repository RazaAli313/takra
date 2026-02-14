from pydantic import BaseModel
class Feature(BaseModel):
    id: str
    icon: str
    title: str
    description: str