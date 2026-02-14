"""Taakra - Competition API (browse, search, filter, calendar)."""
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
from datetime import datetime

from backend.config.database.init import get_event_db

router = APIRouter()


def competition_helper(event, registration_count: int = 0) -> dict:
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "date": event["date"],
        "time": event.get("time", ""),
        "location": event.get("location", ""),
        "description": event.get("description", ""),
        "image_url": event.get("image_url"),
        "registration_open": event.get("registration_open", True),
        "category_id": event.get("category_id"),
        "category_name": event.get("category_name"),
        "rules": event.get("rules", ""),
        "prizes": event.get("prizes", ""),
        "deadline": event.get("deadline"),
        "modules": event.get("modules", []),
        "module_amounts": event.get("module_amounts", {}),
        "discount_codes": event.get("discount_codes", []),
        "created_at": event.get("created_at"),
        "updated_at": event.get("updated_at"),
        "registration_count": registration_count,
        "competitions": event.get("competitions", []),
    }


@router.get("/competitions")
async def list_competitions(
    sort: str = Query("new", description="new | most_registrations | trending"),
    category_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="Category slug or name"),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db=Depends(get_event_db)
):
    """
    Browse competitions with sort, search, and filters.
    - sort: new (default), most_registrations, trending
    - category_id or category: filter by category
    - search: title/description search
    - date_from, date_to: date range filter
    """
    query = {}

    # Category filter
    if category_id and ObjectId.is_valid(category_id):
        query["category_id"] = category_id
    elif category:
        # Resolve by slug or name
        cat = await db.categories.find_one({"$or": [{"slug": category}, {"name": {"$regex": category, "$options": "i"}}]})
        if cat:
            query["category_id"] = str(cat["_id"])

    # Search
    if search and search.strip():
        query["$or"] = [
            {"title": {"$regex": search.strip(), "$options": "i"}},
            {"description": {"$regex": search.strip(), "$options": "i"}},
        ]

    # Date range (events.date is typically YYYY-MM-DD string)
    if date_from or date_to:
        if date_from and date_to:
            query["date"] = {"$gte": date_from, "$lte": date_to}
        elif date_from:
            query["date"] = {"$gte": date_from}
        elif date_to:
            query["date"] = {"$lte": date_to}

    # Build events list with registration counts
    events_raw = []
    async for event in db.events.find(query):
        events_raw.append(event)

    # Get registration count per event (event_id stored as string)
    events_with_count = []
    for event in events_raw:
        eid = str(event["_id"])
        reg_count = await db.event_registrations.count_documents({"event_id": eid})
        events_with_count.append((event, reg_count))

    # Sort
    if sort == "most_registrations":
        events_with_count.sort(key=lambda x: (-x[1], str(x[0].get("created_at", ""))), reverse=False)
    elif sort == "trending":
        events_with_count.sort(key=lambda x: (-x[1], x[0].get("date", "")))
    else:  # new
        events_with_count.sort(key=lambda x: str(x[0].get("created_at", "")), reverse=True)

    # Enrich category_name from categories collection when missing
    for e, _ in events_with_count:
        if e.get("category_id") and not e.get("category_name") and ObjectId.is_valid(e["category_id"]):
            cat = await db.categories.find_one({"_id": ObjectId(e["category_id"])})
            if cat:
                e["category_name"] = cat.get("name", "")

    events = [competition_helper(e, c) for e, c in events_with_count]
    return {"competitions": events, "total": len(events)}


@router.get("/competitions/calendar")
async def competitions_calendar(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    year: Optional[int] = Query(None),
    db=Depends(get_event_db)
):
    """Get competitions in calendar/agenda format."""
    query = {}
    if month:
        # month = "2026-02" -> events where date starts with that
        query["date"] = {"$regex": f"^{month}"}
    elif year:
        query["date"] = {"$regex": f"^{year}-"}

    events = []
    async for event in db.events.find(query).sort("date", 1).sort("time", 1):
        reg_count = await db.event_registrations.count_documents({"event_id": str(event["_id"])})
        events.append(competition_helper(event, reg_count))

    return {"competitions": events, "total": len(events)}


@router.get("/competitions/{competition_id}")
async def get_competition_detail(competition_id: str, db=Depends(get_event_db)):
    """Get detailed competition page (rules, deadlines, prizes)."""
    if not ObjectId.is_valid(competition_id):
        raise HTTPException(status_code=400, detail="Invalid competition ID")
    event = await db.events.find_one({"_id": ObjectId(competition_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Competition not found")
    if event.get("category_id") and not event.get("category_name") and ObjectId.is_valid(event.get("category_id")):
        cat = await db.categories.find_one({"_id": ObjectId(event["category_id"])})
        if cat:
            event["category_name"] = cat.get("name", "")
    reg_count = await db.event_registrations.count_documents({"event_id": competition_id})
    return competition_helper(event, reg_count)


@router.get("/competitions/{competition_id}/registered")
async def get_user_registered_competitions(
    competition_id: str,
    email: str = Query(..., description="User email to check registrations"),
    db=Depends(get_event_db)
):
    """Check if user (by email) is registered for this competition."""
    if not ObjectId.is_valid(competition_id):
        raise HTTPException(status_code=400, detail="Invalid competition ID")
    reg = await db.event_registrations.find_one({
        "event_id": competition_id,
        "members.email": email
    })
    return {"registered": reg is not None, "registration": reg if reg else None}


@router.get("/user/registered-competitions")
async def list_user_registered_competitions(
    email: str = Query(..., description="User email"),
    db=Depends(get_event_db)
):
    """User dashboard: list competitions the user has registered for."""
    regs = []
    async for r in db.event_registrations.find({"members.email": email}).sort("created_at", -1):
        event_id = r.get("event_id")
        if not event_id:
            continue
        event = await db.events.find_one({"_id": ObjectId(event_id)}) if ObjectId.is_valid(event_id) else None
        if not event:
            continue
        regs.append({
            "competition": competition_helper(event, 0),
            "team_name": r.get("team_name"),
            "payment_status": r.get("payment_status", "pending"),
            "registered_at": r.get("created_at"),
            "modules": r.get("modules", []),
        })
    return {"registrations": regs}
