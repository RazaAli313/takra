"""Taakra - Admin-only API to add and manage support members."""
from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi import status
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

from backend.config.database.init import get_event_db
from backend.middleware.auth.token import verify_token

router = APIRouter(prefix="/support-members", tags=["admin-support-members"])


def support_member_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc.get("email", ""),
        "role": doc.get("role", "support"),
        "created_at": doc.get("created_at"),
    }


@router.get("", response_model=List[dict])
async def list_support_members(
    db=Depends(get_event_db),
    auth=Depends(verify_token),
):
    """List all support members (admin-only)."""
    members = []
    async for m in db.support_members.find().sort("created_at", -1):
        members.append(support_member_helper(m))
    return members


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_support_member(
    name: str = Form(...),
    email: str = Form(...),
    role: Optional[str] = Form("support"),
    db=Depends(get_event_db),
    auth=Depends(verify_token),
):
    """Add a support member (admin-only)."""
    email = (email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    existing = await db.support_members.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="A support member with this email already exists")
    now = datetime.utcnow()
    doc = {
        "name": name.strip(),
        "email": email,
        "role": (role or "support").strip() or "support",
        "created_at": now,
    }
    result = await db.support_members.insert_one(doc)
    created = await db.support_members.find_one({"_id": result.inserted_id})
    return support_member_helper(created)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_support_member(
    member_id: str,
    db=Depends(get_event_db),
    auth=Depends(verify_token),
):
    """Remove a support member (admin-only)."""
    if not ObjectId.is_valid(member_id):
        raise HTTPException(status_code=400, detail="Invalid member ID")
    res = await db.support_members.delete_one({"_id": ObjectId(member_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Support member not found")
    return None
