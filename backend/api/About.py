from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from bson import ObjectId
from PIL import Image, UnidentifiedImageError
import logging
from backend.Schemas.Feature import Feature
from backend.Schemas.About import AboutContent
from dotenv import load_dotenv
from backend.config.database.init import get_misc_db
from backend.utils.CloudinaryImageUploader import save_uploaded_image


load_dotenv()
import io


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
router = APIRouter()





async def get_about_content(db):
    content = await db.about_page.find_one({"_id": "about_content"})
    if not content:

        default_content = {
            "_id": "about_content",
            "founded_year": "2024",
            "club_name": "FCIT Developers Club",
            "member_count": "24",
            "activities": "hackathons, tech talks, workshops, and networking events",
            "features": [
                {
                    "id": "1",
                    "icon": "RocketLaunchIcon",
                    "title": "Innovation",
                    "description": "We foster a culture of innovation and cutting-edge technology exploration."
                },
                {
                    "id": "2",
                    "icon": "CodeBracketIcon",
                    "title": "Development",
                    "description": "Regular coding sessions and hackathons to sharpen your skills."
                }
            ],
            "updated_at": datetime.utcnow()
        }
        await db.about_page.insert_one(default_content)
        return default_content
    return content

@router.post("/about/upload-image")
async def upload_about_image(image: UploadFile = File(...), db=Depends(get_misc_db)):
    try:

        image_url = await save_uploaded_image(image, "about")

   
        await db.about_page.update_one(
            {"_id": "about_content"},
            {"$set": {"image_url": image_url, "updated_at": datetime.utcnow()}},
            upsert=True
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"imageUrl": image_url}
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )

@router.get("/about", response_model=AboutContent)
async def get_about(db=Depends(get_misc_db)):
    content = await get_about_content(db)
    return content

@router.put("/about", response_model=AboutContent)
async def update_about(content: AboutContent, db=Depends(get_misc_db)):
    feature_ids = [f.id for f in content.features]
    if len(feature_ids) != len(set(feature_ids)):
        raise HTTPException(status_code=400, detail="Duplicate feature IDs found")
    
    update_data = {
        "founded_year": content.founded_year,
        "club_name": content.club_name,
        "member_count": content.member_count,
        "activities": content.activities,
        "features": [f.dict() for f in content.features],
        "updated_at": datetime.utcnow()
    }

    result = await db.about_page.update_one(
        {"_id": "about_content"},
        {"$set": update_data},
        upsert=True
    )

    if not result.modified_count and not result.upserted_id:
        raise HTTPException(status_code=400, detail="Update failed")
    
    return await get_about_content(db)

@router.delete("/about/features/{feature_id}", response_model=AboutContent)
async def delete_feature(feature_id: str, db=Depends(get_misc_db)):
    content = await get_about_content(db)
    updated_features = [f for f in content["features"] if f["id"] != feature_id]
    
    if len(updated_features) == len(content["features"]):
        raise HTTPException(status_code=404, detail="Feature not found")
    
    await db.about_page.update_one(
        {"_id": "about_content"},
        {"$set": {"features": updated_features, "updated_at": datetime.utcnow()}}
    )
    
    return await get_about_content(db)
