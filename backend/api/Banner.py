from fastapi import HTTPException, Form, status, APIRouter, Depends
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
import logging
from typing import Optional
from backend.Schemas.Banner import BannerItem
from backend.config.database.init import get_misc_db


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/banner", response_model=dict)
async def create_banner(
    text: str = Form(...),
    link: Optional[str] = Form(None),
    is_active: bool = Form(True),
    db=Depends(get_misc_db)
):
    try:
        # Validate input
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Banner text is required")
        
        # Deactivate all other banners when creating a new active banner
        if is_active:
            await db.banners.update_many(
                {"is_active": True},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
        
        # Create new banner
        new_banner = {
            "id": str(uuid.uuid4()),
            "text": text.strip(),
            "link": link.strip() if link else None,
            "is_active": is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = await db.banners.insert_one(new_banner)
        new_banner["_id"] = str(result.inserted_id)
        new_banner["created_at"] = new_banner["created_at"].isoformat()
        new_banner["updated_at"] = new_banner["updated_at"].isoformat()
        
        return {
            "message": "Banner created successfully",
            "banner": new_banner,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating banner: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/banner", response_model=Optional[BannerItem])
async def get_active_banner(db=Depends(get_misc_db)):
    """Get the currently active banner"""
    try:
        banner = await db.banners.find_one({"is_active": True})
        
        if not banner:
            return None
        
        # Convert ObjectId to string and datetime to ISO string
        banner["_id"] = str(banner["_id"])
        if isinstance(banner.get("created_at"), datetime):
            banner["created_at"] = banner["created_at"].isoformat()
        if isinstance(banner.get("updated_at"), datetime):
            banner["updated_at"] = banner["updated_at"].isoformat()
        
        return banner
    except Exception as e:
        logger.error(f"Error fetching active banner: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/banner/all", response_model=list)
async def get_all_banners(db=Depends(get_misc_db)):
    """Get all banners (for admin panel)"""
    try:
        banners = []
        async for banner in db.banners.find().sort("created_at", -1):
            banner["_id"] = str(banner["_id"])
            if isinstance(banner.get("created_at"), datetime):
                banner["created_at"] = banner["created_at"].isoformat()
            if isinstance(banner.get("updated_at"), datetime):
                banner["updated_at"] = banner["updated_at"].isoformat()
            banners.append(banner)
        
        return banners
    except Exception as e:
        logger.error(f"Error fetching all banners: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/banner/{banner_id}", response_model=dict)
async def update_banner(
    banner_id: str,
    text: Optional[str] = Form(None),
    link: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    db=Depends(get_misc_db)
):
    try:
        # Check if banner exists
        existing_banner = await db.banners.find_one({"id": banner_id})
        if not existing_banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        
        update_data = {"updated_at": datetime.utcnow()}
        
        # Update fields if provided
        if text is not None:
            if not text.strip():
                raise HTTPException(status_code=400, detail="Banner text cannot be empty")
            update_data["text"] = text.strip()
        
        if link is not None:
            update_data["link"] = link.strip() if link else None
        
        # Handle is_active: if setting to True, deactivate all others
        if is_active is not None:
            if is_active and not existing_banner.get("is_active"):
                # Deactivate all other banners
                await db.banners.update_many(
                    {"is_active": True, "id": {"$ne": banner_id}},
                    {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
                )
            update_data["is_active"] = is_active
        
        # Update in MongoDB
        result = await db.banners.update_one(
            {"id": banner_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes were made")
        
        # Fetch updated banner
        updated_banner = await db.banners.find_one({"id": banner_id})
        updated_banner["_id"] = str(updated_banner["_id"])
        if isinstance(updated_banner.get("created_at"), datetime):
            updated_banner["created_at"] = updated_banner["created_at"].isoformat()
        if isinstance(updated_banner.get("updated_at"), datetime):
            updated_banner["updated_at"] = updated_banner["updated_at"].isoformat()
        
        return {
            "message": "Banner updated successfully",
            "banner": updated_banner,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating banner: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/banner/{banner_id}")
async def delete_banner(banner_id: str, db=Depends(get_misc_db)):
    try:
        # Delete from MongoDB
        result = await db.banners.delete_one({"id": banner_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Banner not found")
        
        return {
            "message": "Banner deleted successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting banner: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

