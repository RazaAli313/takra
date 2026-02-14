from fastapi import HTTPException, Form, File, UploadFile, status, APIRouter, Depends
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
import os
import aiofiles
from typing import List, Optional
from backend.Schemas.Content import ContentItem

import io
from PIL import Image, UnidentifiedImageError 

import logging
from bson import ObjectId
from backend.utils.CloudinaryImageUploader import save_uploaded_image
from backend.config.database.init import get_misc_db


router = APIRouter()
logger = logging.getLogger(__name__)






@router.post("/content", response_model=dict)
async def add_content(
    type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    url: str = Form(None),  # Make URL optional for images
    image: UploadFile = File(None),  # Add file upload parameter
    thumbnail: Optional[str] = Form(None),
    db=Depends(get_misc_db)
):
    try:
        # Validate input
        if type not in ["video", "image"]:
            raise HTTPException(status_code=400, detail="Invalid content type")
        
        if not all([title, description]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # For images: either URL or file upload is required
        if type == "image" and not url and not image:
            raise HTTPException(status_code=400, detail="Either image URL or file upload is required for image content")
        
        # For videos: URL is required
        if type == "video" and not url:
            raise HTTPException(status_code=400, detail="URL is required for video content")
        
        final_url = url
        
        # Handle image file upload
        if type == "image" and image:
            final_url = await save_uploaded_image(image, "content")
        
        # Create new content item
        new_content = {
            "id": str(uuid.uuid4()),
            "type": type,
            "title": title,
            "description": description,
            "url": final_url,
            "thumbnail": thumbnail,
            "date": datetime.now().isoformat(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = await db.content.insert_one(new_content)
        
        # Add MongoDB ID to the response
        new_content["_id"] = str(result.inserted_id)
        
        return {
            "message": "Content added successfully", 
            "content": new_content,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/content", response_model=List[ContentItem])
async def get_content(db=Depends(get_misc_db)):
    try:
        # Fetch all content from MongoDB, sorted by creation date (newest first)
        content_items = []
        async for item in db.content.find().sort("created_at", -1):
            # Convert ObjectId to string for JSON serialization
            item["_id"] = str(item["_id"])
            content_items.append(item)
        
        return content_items
    except Exception as e:
        logger.error(f"Error fetching content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/content/{content_id}", response_model=ContentItem)
async def get_content_by_id(content_id: str, db=Depends(get_misc_db)):
    try:
        # Find content by ID in MongoDB
        content = await db.content.find_one({"id": content_id})
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Convert ObjectId to string for JSON serialization
        content["_id"] = str(content["_id"])
        
        return content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching content by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/content/{content_id}", response_model=dict)
async def update_content(
    content_id: str,
    type: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    thumbnail: Optional[str] = Form(None),
    db=Depends(get_misc_db)
):
    try:
        # Check if content exists
        existing_content = await db.content.find_one({"id": content_id})
        if not existing_content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        update_data = {"updated_at": datetime.utcnow()}
        
        # Update fields if provided
        if type:
            if type not in ["video", "image"]:
                raise HTTPException(status_code=400, detail="Invalid content type")
            update_data["type"] = type
        
        if title:
            update_data["title"] = title
        
        if description:
            update_data["description"] = description
        
        # Handle image file upload
        final_url = url
        if image:
            final_url = await save_uploaded_image(image, "content")
            update_data["url"] = final_url
        elif url:
            update_data["url"] = url
        
        if thumbnail:
            update_data["thumbnail"] = thumbnail
        
        # Update in MongoDB
        result = await db.content.update_one(
            {"id": content_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes were made")
        
        # Fetch updated content
        updated_content = await db.content.find_one({"id": content_id})
        updated_content["_id"] = str(updated_content["_id"])
        
        return {
            "message": "Content updated successfully", 
            "content": updated_content,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/content/{content_id}")
async def delete_content(content_id: str, db=Depends(get_misc_db)):
    try:
        # Delete from MongoDB
        result = await db.content.delete_one({"id": content_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Content not found")
        
        return {
            "message": "Content deleted successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Endpoint specifically for uploading images to Cloudinary"""
    try:
        image_url = await save_uploaded_image(file, "content")
        
        return {
            "filename": file.filename,
            "url": image_url,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check(db=Depends(get_misc_db)):
    try:
        # Test database connection
        await db.command("ping")
        return {
            "status": "healthy", 
            "timestamp": datetime.now().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")