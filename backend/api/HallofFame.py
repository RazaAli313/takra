# Achievement endpoints

from typing import List
from datetime import datetime

from bson import ObjectId
from fastapi import UploadFile, File, Form
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from enum import Enum
from backend.Schemas.Achievement import Achievement, AchievementCreate
from backend.utils.CloudinaryImageUploader import save_uploaded_image
from backend.config.database.init import get_misc_db
router = APIRouter()

logger = logging.getLogger(__name__)


def _normalize_year(year) -> str:
    """Ensure year is exactly 4 characters for Achievement schema (max_length=4)."""
    if year is None:
        return "0000"
    if isinstance(year, datetime):
        return str(year.year)
    if isinstance(year, int):
        return str(year).zfill(4)[:4]
    s = str(year).strip()
    digits = "".join(c for c in s if c.isdigit())
    if len(digits) >= 4:
        return digits[:4]
    if digits:
        return digits.zfill(4)
    return "0000"


def achievement_helper(achievement) -> dict:
    return {
        "id": str(achievement["_id"]),
        "year": _normalize_year(achievement.get("year")),
        "month": achievement.get("month") or "",
        "title": achievement["title"],
        "description": achievement["description"],
        "icon": achievement["icon"],
        "image_url": achievement.get("image_url"),
        "created_at": achievement["created_at"],
        "updated_at": achievement["updated_at"],
    }

@router.get("/achievements/{achievement_id}", response_model=Achievement)
async def get_achievement_detail(achievement_id: str, db=Depends(get_misc_db)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=422, detail="Invalid achievement ID")
    achievement = await db.achievements.find_one({"_id": ObjectId(achievement_id)})
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    # Ensure all required fields are present
    achievement_dict = achievement_helper(achievement)
    # Fill missing fields with defaults for Pydantic validation
    for field in ["year", "month", "title", "description", "icon", "created_at", "updated_at"]:
        if achievement_dict.get(field) is None:
            achievement_dict[field] = "" if field not in ["created_at", "updated_at"] else datetime.utcnow()
    if "image_url" not in achievement_dict:
        achievement_dict["image_url"] = None
    return Achievement(**achievement_dict)
@router.get("/achievements", response_model=List[Achievement])
async def get_achievements(db=Depends(get_misc_db)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    achievements = []
    async for achievement in db.achievements.find().sort("created_at", -1):
        # Only include achievements with valid description
        desc = achievement.get("description", "")
        if desc and isinstance(desc, str) and len(desc) >= 10:
            achievements.append(achievement_helper(achievement))
    return achievements



@router.post("/achievements", response_model=Achievement, status_code=status.HTTP_201_CREATED)
async def create_achievement(
    year: str = Form(...),
    month: str = Form(""),
    title: str = Form(...),
    description: str = Form(...),
    icon: str = Form(...),
    image: UploadFile = File(None),
    db=Depends(get_misc_db)
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    achievement_data = {
        "year": year,
        "month": (month or "").strip() or None,
        "title": title,
        "description": description,
        "icon": icon,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    image_url = None
    if image:
        image_url = await save_uploaded_image(image, "achievements", "MISC")
        achievement_data["image_url"] = image_url
    new_achievement = await db.achievements.insert_one(achievement_data)
    created_achievement = await db.achievements.find_one({"_id": new_achievement.inserted_id})
    return achievement_helper(created_achievement)

@router.put("/achievements/{achievement_id}", response_model=Achievement)
async def update_achievement(
    achievement_id: str,
    year: str = Form(...),
    month: str = Form(""),
    title: str = Form(...),
    description: str = Form(...),
    icon: str = Form(...),
    image: UploadFile = File(None),
    db=Depends(get_misc_db)
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    achievement_data = {
        "year": year,
        "month": (month or "").strip() or None,
        "title": title,
        "description": description,
        "icon": icon,
        "updated_at": datetime.utcnow(),
    }
    if image and image.filename:
        achievement_data["image_url"] = await save_uploaded_image(image, "achievements", "ACHIEVEMENTS")
    updated_achievement = await db.achievements.find_one_and_update(
        {"_id": ObjectId(achievement_id)},
        {"$set": achievement_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return achievement_helper(updated_achievement)

@router.delete("/achievements/{achievement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_achievement(achievement_id: str, db=Depends(get_misc_db)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=400, detail="Invalid achievement ID")
    
    delete_result = await db.achievements.delete_one({"_id": ObjectId(achievement_id)})
    
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    return None
