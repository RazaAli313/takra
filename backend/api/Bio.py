from fastapi import APIRouter, HTTPException, Depends
from backend.config.database.init import get_event_db
from backend.Schemas.Event import TeamMember

router = APIRouter()

@router.get("/team-members/{email}", response_model=TeamMember)
async def get_team_member_profile(email: str, db=Depends(get_event_db)):
    member = await db.team_members.find_one({"email": email})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member

@router.get("/advisors/{email}", response_model=TeamMember)
async def get_advisor_profile(email: str, db=Depends(get_event_db)):
    advisor = await db.advisors.find_one({"email": email})
    if not advisor:
        raise HTTPException(status_code=404, detail="Advisor not found")
    return advisor
