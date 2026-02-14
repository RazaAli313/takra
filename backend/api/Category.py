"""Taakra - Category API for competition categories."""
from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi import status
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

from backend.config.database.init import get_event_db
from backend.Schemas.Category import CategoryInDB
from backend.middleware.auth.token import verify_token

router = APIRouter()


def category_helper(cat) -> dict:
    return {
        "id": str(cat["_id"]),
        "name": cat["name"],
        "slug": cat.get("slug", cat["name"].lower().replace(" ", "-")),
        "description": cat.get("description", ""),
        "order": cat.get("order", 0),
        "created_at": cat.get("created_at"),
        "updated_at": cat.get("updated_at"),
    }


@router.get("/categories", response_model=List[CategoryInDB])
async def list_categories(db=Depends(get_event_db)):
    """List all categories, sorted by order."""
    categories = []
    async for cat in db.categories.find().sort("order", 1).sort("name", 1):
        categories.append(category_helper(cat))
    return categories


@router.post("/categories", response_model=CategoryInDB, status_code=status.HTTP_201_CREATED)
async def create_category(
    name: str = Form(...),
    slug: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    order: int = Form(0),
    db=Depends(get_event_db),
    auth=Depends(verify_token),
):
    """Create a category (admin-only)."""
    slug_val = slug or name.lower().replace(" ", "-").replace("/", "-")
    now = datetime.utcnow()
    data = {
        "name": name,
        "slug": slug_val,
        "description": description or "",
        "order": order,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.categories.insert_one(data)
    created = await db.categories.find_one({"_id": result.inserted_id})
    return category_helper(created)


@router.put("/categories/{category_id}", response_model=CategoryInDB)
async def update_category(
    category_id: str,
    name: str = Form(...),
    slug: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    order: int = Form(0),
    db=Depends(get_event_db),
    auth=Depends(verify_token),
):
    """Update a category (admin-only)."""
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID")
    slug_val = slug or name.lower().replace(" ", "-").replace("/", "-")
    now = datetime.utcnow()
    update = {
        "name": name,
        "slug": slug_val,
        "description": description or "",
        "order": order,
        "updated_at": now,
    }
    updated = await db.categories.find_one_and_update(
        {"_id": ObjectId(category_id)},
        {"$set": update},
        return_document=True
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return category_helper(updated)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db=Depends(get_event_db),
    auth=Depends(verify_token),
):
    """Delete a category (admin-only)."""
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID")
    res = await db.categories.delete_one({"_id": ObjectId(category_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return None
