from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Subscriber(BaseModel):
    email: str
    subscribed_at: Optional[datetime] = datetime.utcnow()
