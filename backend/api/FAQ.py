from fastapi import HTTPException, Form, status, APIRouter, Depends
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
import logging
from typing import Optional, List
from backend.Schemas.FAQ import FAQItem
from backend.config.database.init import get_misc_db


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/faq", response_model=dict)
async def create_faq(
    question: str = Form(...),
    answer: str = Form(...),
    category: Optional[str] = Form("General"),
    order: int = Form(0),
    is_active: bool = Form(True),
    db=Depends(get_misc_db)
):
    try:
        # Validate input
        if not question or not question.strip():
            raise HTTPException(status_code=400, detail="Question is required")
        if not answer or not answer.strip():
            raise HTTPException(status_code=400, detail="Answer is required")
        
        # Create new FAQ
        new_faq = {
            "id": str(uuid.uuid4()),
            "question": question.strip(),
            "answer": answer.strip(),
            "category": category.strip() if category else "General",
            "order": order,
            "is_active": is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = await db.faqs.insert_one(new_faq)
        new_faq["_id"] = str(result.inserted_id)
        new_faq["created_at"] = new_faq["created_at"].isoformat()
        new_faq["updated_at"] = new_faq["updated_at"].isoformat()
        
        return {
            "message": "FAQ created successfully",
            "faq": new_faq,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/faq", response_model=List[FAQItem])
async def get_active_faqs(db=Depends(get_misc_db)):
    """Get all active FAQs, sorted by order"""
    try:
        faqs = []
        async for faq in db.faqs.find({"is_active": True}).sort("order", 1):
            faq["_id"] = str(faq["_id"])
            if isinstance(faq.get("created_at"), datetime):
                faq["created_at"] = faq["created_at"].isoformat()
            if isinstance(faq.get("updated_at"), datetime):
                faq["updated_at"] = faq["updated_at"].isoformat()
            faqs.append(faq)
        
        return faqs
    except Exception as e:
        logger.error(f"Error fetching FAQs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/faq/all", response_model=List[FAQItem])
async def get_all_faqs(db=Depends(get_misc_db)):
    """Get all FAQs (for admin panel)"""
    try:
        faqs = []
        async for faq in db.faqs.find().sort([("order", 1), ("created_at", -1)]):
            faq["_id"] = str(faq["_id"])
            if isinstance(faq.get("created_at"), datetime):
                faq["created_at"] = faq["created_at"].isoformat()
            if isinstance(faq.get("updated_at"), datetime):
                faq["updated_at"] = faq["updated_at"].isoformat()
            faqs.append(faq)
        
        return faqs
    except Exception as e:
        logger.error(f"Error fetching all FAQs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/faq/{faq_id}", response_model=dict)
async def update_faq(
    faq_id: str,
    question: Optional[str] = Form(None),
    answer: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    order: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    db=Depends(get_misc_db)
):
    try:
        # Check if FAQ exists
        existing_faq = await db.faqs.find_one({"id": faq_id})
        if not existing_faq:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        update_data = {"updated_at": datetime.utcnow()}
        
        # Update fields if provided
        if question is not None:
            if not question.strip():
                raise HTTPException(status_code=400, detail="Question cannot be empty")
            update_data["question"] = question.strip()
        
        if answer is not None:
            if not answer.strip():
                raise HTTPException(status_code=400, detail="Answer cannot be empty")
            update_data["answer"] = answer.strip()
        
        if category is not None:
            update_data["category"] = category.strip() if category else "General"
        
        if order is not None:
            update_data["order"] = order
        
        if is_active is not None:
            update_data["is_active"] = is_active
        
        # Update in MongoDB
        result = await db.faqs.update_one(
            {"id": faq_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes were made")
        
        # Fetch updated FAQ
        updated_faq = await db.faqs.find_one({"id": faq_id})
        updated_faq["_id"] = str(updated_faq["_id"])
        if isinstance(updated_faq.get("created_at"), datetime):
            updated_faq["created_at"] = updated_faq["created_at"].isoformat()
        if isinstance(updated_faq.get("updated_at"), datetime):
            updated_faq["updated_at"] = updated_faq["updated_at"].isoformat()
        
        return {
            "message": "FAQ updated successfully",
            "faq": updated_faq,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/faq/{faq_id}")
async def delete_faq(faq_id: str, db=Depends(get_misc_db)):
    try:
        # Delete from MongoDB
        result = await db.faqs.delete_one({"id": faq_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        return {
            "message": "FAQ deleted successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

