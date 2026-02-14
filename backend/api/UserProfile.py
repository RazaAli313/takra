"""
User profile image upload using project's Cloudinary uploader.
"""
import logging
from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.utils.CloudinaryImageUploader import save_uploaded_image

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/user/upload-profile-image")
async def upload_profile_image(image: UploadFile = File(...)):
    """Upload a profile image to Cloudinary. Returns the image URL."""
    try:
        image_url = await save_uploaded_image(image, "profile")
        return {"url": image_url, "success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile image upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
