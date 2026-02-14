from pydantic import BaseModel
# Pydantic model for reorder payload

from fastapi import Body
# --- Add reorder endpoint at the end ---

from enum import Enum
from typing import Optional, List
from bson import ObjectId
from fastapi import HTTPException, UploadFile, File, Form, status, APIRouter, Depends
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
import cloudinary
import cloudinary.uploader
import io
import os
import logging
from datetime import datetime
from backend.Schemas.Team import TeamMemberInDB, TeamMemberCreate, TeamMemberUpdate, SocialLinks, MemberType
import json
from backend.utils.CloudinaryImageUploader import save_uploaded_image
import backend.config.database.init as config
from backend.config.database.init import get_misc_db
from typing import List


class TeamOrderRequest(BaseModel):
    order: List[str]
    tenure: str  # The tenure for which we're reordering
db = config.miscDB

router = APIRouter()


logger = logging.getLogger(__name__)

async def get_member_or_404(member_id: str, db=None):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member["id"] = str(member["_id"])
    # Convert old string tenure format to array format for backward compatibility
    if "tenure" in member:
        if isinstance(member["tenure"], str):
            member["tenure"] = [member["tenure"]] if member["tenure"] else None
        elif member["tenure"] is None:
            member["tenure"] = None
    else:
        member["tenure"] = None
    
    # Convert old role format to roles_by_tenure for backward compatibility
    if "roles_by_tenure" not in member or not member.get("roles_by_tenure"):
        old_role = member.get("role")
        if old_role and member.get("tenure"):
            tenures = member["tenure"] if isinstance(member["tenure"], list) else [member["tenure"]] if member["tenure"] else []
            if tenures:
                member["roles_by_tenure"] = {t: old_role for t in tenures}
    
    return TeamMemberInDB(**member)



# async def save_uploaded_image(file: UploadFile, image_type: str = "team") -> str:
    """Validate, process, and upload an image to Cloudinary using unsigned upload."""
    try:
        logger.info(f"Processing {image_type} image upload: {file.filename}")

        # --- Step 1: Validate file ---
        if not file.filename:
            raise ValueError("No filename provided")
        if not file.content_type or not file.content_type.startswith("image/"):
            raise ValueError("Only image files are allowed")

        contents = await file.read()
        if not contents:
            raise ValueError("Empty file received")
        if len(contents) > 2 * 1024 * 1024:  # 2MB
            raise ValueError("Image exceeds 2MB size limit")

        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ['jpg', 'jpeg', 'png', 'webp']:
            raise ValueError("Only JPG, PNG, or WEBP images are allowed")

        # --- Step 2: Process image ---
        try:
            with Image.open(io.BytesIO(contents)) as img:
                img.verify()  # Confirm it's a real image

            with Image.open(io.BytesIO(contents)) as img:
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                img.thumbnail((1200, 800))  # Resize while maintaining aspect ratio

                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=85, optimize=True)
                buffer.seek(0)

        except UnidentifiedImageError:
            raise ValueError("Invalid image file (cannot identify)")
        except Exception as img_error:
            raise ValueError(f"Image processing failed: {str(img_error)}")

        # --- Step 3: Upload to Cloudinary (unsigned) ---
        result = cloudinary.uploader.unsigned_upload(
            buffer,
            upload_preset=UPLOAD_PRESET,
            folder=f"{image_type}_images"
        )

        image_url = result.get("secure_url")
        if not image_url:
            raise ValueError("Cloudinary upload returned no URL")

        logger.info(f"Successfully uploaded image to Cloudinary: {image_url}")
        return image_url

    except Exception as e:
        logger.error(f"Image upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image validation failed: {str(e)}"
        )

# Helper function to get current tenure (e.g., "2025-2026")
def get_current_tenure():
    from datetime import datetime
    current_year = datetime.now().year
    return f"{current_year}-{current_year + 1}"

# Member endpoints
@router.post("/members/", response_model=TeamMemberInDB, status_code=201)
async def create_member(
    name: str = Form(...),
    role: Optional[str] = Form(None),  # Deprecated: kept for backward compatibility
    roles_by_tenure: Optional[str] = Form(None),  # JSON string dict mapping tenure to role
    member_type: str = Form(...),
    tenure: Optional[str] = Form(None),  # JSON string array or comma-separated string
    bio: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    github: Optional[str] = Form(None),
    twitter: Optional[str] = Form(None),
    portfolio: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    projects: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education: Optional[str] = Form(None),
    email: Optional[str] = Form(None),  # Email for member portal login
    image: Optional[UploadFile] = File(None),
    db=Depends(get_misc_db)
):
    try:
        # Validate and convert member_type
        try:
            member_type_enum = MemberType(member_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid member_type. Must be one of: {[e.value for e in MemberType]}"
            )
        
        # Create social links object
        socials = SocialLinks(
            linkedin=linkedin,
            github=github,
            twitter=twitter,
            portfolio=portfolio
        )
        
        # Upload image if provided
        image_url = None
        if image:
            image_url = await save_uploaded_image(image,"team")

        # Parse tenure - support both JSON array and comma-separated string, or single string
        member_tenures = []
        if tenure:
            try:
                # Try parsing as JSON array first
                parsed = json.loads(tenure)
                if isinstance(parsed, list):
                    member_tenures = parsed
                elif isinstance(parsed, str):
                    member_tenures = [parsed]
            except (json.JSONDecodeError, TypeError):
                # If not JSON, try comma-separated string
                if ',' in tenure:
                    member_tenures = [t.strip() for t in tenure.split(',') if t.strip()]
                else:
                    member_tenures = [tenure.strip()] if tenure.strip() else []
        
        # If no tenures provided, default to current tenure
        if not member_tenures:
            member_tenures = [get_current_tenure()]

        # Parse roles_by_tenure if provided
        roles_dict = {}
        if roles_by_tenure:
            try:
                roles_dict = json.loads(roles_by_tenure)
                if not isinstance(roles_dict, dict):
                    roles_dict = {}
            except (json.JSONDecodeError, TypeError):
                roles_dict = {}
        
        # If roles_by_tenure is empty but role is provided, use role for all tenures (backward compatibility)
        if not roles_dict and role:
            roles_dict = {t: role for t in member_tenures}
        
        # If still no roles, set default role for all tenures
        if not roles_dict:
            default_role = role or "Member"
            roles_dict = {t: default_role for t in member_tenures}

        # Create member data
        member_data = {
            "name": name,
            "role": role,  # Keep for backward compatibility
            "roles_by_tenure": roles_dict,
            "member_type": member_type_enum.value,
            "tenure": member_tenures,
            "bio": bio,
            "socials": socials.dict(),
            "skills": json.loads(skills) if skills else [],
            "projects": json.loads(projects) if projects else [],
            "experience": json.loads(experience) if experience else [],
            "education": json.loads(education) if education else [],
            "image_url": image_url,
            "email": email.lower().strip() if email else None,  # Email for member portal
            "has_portal_access": False,  # Will be set to True when member logs in
            "order_by_tenure": {},  # Initialize empty order_by_tenure dict
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into database
        result = await db.members.insert_one(member_data)
        created_member = await db.members.find_one({"_id": result.inserted_id})
        created_member["id"] = str(created_member["_id"])
        
        return TeamMemberInDB(**created_member)
        
    except Exception as e:
        print(f"Error creating member: {str(e)}")  # Add detailed logging
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/members/", response_model=List[TeamMemberInDB])
async def get_all_members(
    member_type: Optional[MemberType] = None, 
    tenure: Optional[str] = None,
    db=Depends(get_misc_db)
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    query = {}
    if member_type:
        query["member_type"] = member_type.value
    if tenure:
        # Support both old format (string) and new format (array)
        query["$or"] = [
            {"tenure": tenure},  # Old format: single string
            {"tenure": {"$in": [tenure]}}  # New format: array containing this tenure
        ]
        
    members = []
    # Fetch all members first
    async for member in db.members.find(query):
        member["id"] = str(member["_id"])
        # Convert old string tenure format to array format for backward compatibility
        if "tenure" in member and isinstance(member["tenure"], str):
            member["tenure"] = [member["tenure"]] if member["tenure"] else None
        elif "tenure" not in member or member["tenure"] is None:
            member["tenure"] = None
        
        # Convert old role format to roles_by_tenure for backward compatibility
        if "roles_by_tenure" not in member or not member.get("roles_by_tenure"):
            old_role = member.get("role")
            if old_role and member.get("tenure"):
                tenures = member["tenure"] if isinstance(member["tenure"], list) else [member["tenure"]] if member["tenure"] else []
                if tenures:
                    member["roles_by_tenure"] = {t: old_role for t in tenures}
        
        # Ensure order_by_tenure exists (initialize if missing)
        if "order_by_tenure" not in member or not isinstance(member.get("order_by_tenure"), dict):
            member["order_by_tenure"] = {}
        
        # Store as dict for sorting, then convert to Pydantic model
        members.append(member)
    
    # Sort by tenure-specific order if tenure is provided
    if tenure:
        def get_tenure_order(member):
            order_by_tenure = member.get("order_by_tenure", {})
            if isinstance(order_by_tenure, dict) and tenure in order_by_tenure:
                return order_by_tenure[tenure]
            # Fallback to old 'order' field for backward compatibility
            if "order" in member and member["order"] is not None:
                return member["order"]
            # If no order, use a large number to push to end
            return 9999
        
        members.sort(key=get_tenure_order)
    else:
        # If no tenure filter, sort by created_at
        members.sort(key=lambda m: m.get("created_at", datetime.utcnow()), reverse=True)
    
    # Convert to Pydantic models after sorting
    return [TeamMemberInDB(**member) for member in members]


@router.get("/members/tenures/", response_model=List[str])
async def get_all_tenures(member_type: Optional[MemberType] = None, db=Depends(get_misc_db)):
    """Get all unique tenures for filtering. Always includes current tenure."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {"member_type": member_type.value} if member_type else {}
    tenures = set()
    async for member in db.members.find(query):
        member_tenure = member.get("tenure")
        if member_tenure:
            # Support both old format (string) and new format (array)
            if isinstance(member_tenure, list):
                for t in member_tenure:
                    if t:
                        tenures.add(t)
            elif isinstance(member_tenure, str):
                tenures.add(member_tenure)
    
    # Always include current tenure
    current_tenure = get_current_tenure()
    tenures.add(current_tenure)
    
    # Sort tenures in descending order (newest first)
    sorted_tenures = sorted(tenures, reverse=True)
    return sorted_tenures

@router.get("/members/{member_id}", response_model=TeamMemberInDB)
async def get_member(member_id: str, db=Depends(get_misc_db)):
    return await get_member_or_404(member_id, db)

@router.put("/members/{member_id}", response_model=TeamMemberInDB)
async def update_member(
    member_id: str,
    name: str = Form(...),
    role: Optional[str] = Form(None),  # Deprecated: kept for backward compatibility
    roles_by_tenure: Optional[str] = Form(None),  # JSON string dict mapping tenure to role
    member_type: str = Form(...),  # Changed from MemberType to str
    tenure: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    github: Optional[str] = Form(None),
    twitter: Optional[str] = Form(None),
    portfolio: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    projects: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    education: Optional[str] = Form(None),
    email: Optional[str] = Form(None),  # Email for member portal login
    image: Optional[UploadFile] = File(None),
    db=Depends(get_misc_db)
):
    # Check if member exists
    existing_member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Validate and convert member_type
    try:
        member_type_enum = MemberType(member_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid member_type. Must be one of: {[e.value for e in MemberType]}")
    
    # Upload new image if provided
    image_url = existing_member.get("image_url")
    if image:
        image_url = await save_uploaded_image(image,"team")
    
    # Create social links object
    socials = SocialLinks(
        linkedin=linkedin,
        github=github,
        twitter=twitter,
        portfolio=portfolio
    )
    
    # Parse tenure - support both JSON array and comma-separated string, or single string
    member_tenures = []
    if tenure:
        try:
            # Try parsing as JSON array first
            parsed = json.loads(tenure)
            if isinstance(parsed, list):
                member_tenures = parsed
            elif isinstance(parsed, str):
                member_tenures = [parsed]
        except (json.JSONDecodeError, TypeError):
            # If not JSON, try comma-separated string
            if ',' in tenure:
                member_tenures = [t.strip() for t in tenure.split(',') if t.strip()]
            else:
                member_tenures = [tenure.strip()] if tenure.strip() else []
    
    # If no tenures provided, keep existing or default to current
    if not member_tenures:
        existing_tenure = existing_member.get('tenure')
        if isinstance(existing_tenure, list):
            member_tenures = existing_tenure
        elif isinstance(existing_tenure, str):
            member_tenures = [existing_tenure]
        else:
            member_tenures = [get_current_tenure()]
    
    # Parse roles_by_tenure if provided
    roles_dict = {}
    if roles_by_tenure:
        try:
            roles_dict = json.loads(roles_by_tenure)
            if not isinstance(roles_dict, dict):
                roles_dict = {}
        except (json.JSONDecodeError, TypeError):
            roles_dict = {}
    
    # If roles_by_tenure is empty but role is provided, use role for all tenures (backward compatibility)
    if not roles_dict and role:
        roles_dict = {t: role for t in member_tenures}
    
    # If still no roles, try to preserve existing roles_by_tenure or use existing role
    if not roles_dict:
        existing_roles_by_tenure = existing_member.get('roles_by_tenure')
        if isinstance(existing_roles_by_tenure, dict):
            # Keep existing roles for existing tenures, add default for new tenures
            roles_dict = existing_roles_by_tenure.copy()
            for t in member_tenures:
                if t not in roles_dict:
                    roles_dict[t] = existing_member.get('role') or "Member"
        else:
            # Fallback to existing role or default
            default_role = existing_member.get('role') or role or "Member"
            roles_dict = {t: default_role for t in member_tenures}
    
    # Preserve existing order_by_tenure if it exists, otherwise initialize empty dict
    existing_order_by_tenure = existing_member.get('order_by_tenure', {})
    if not isinstance(existing_order_by_tenure, dict):
        existing_order_by_tenure = {}
    
    # Update member data
    update_data = {
        "name": name,
        "role": role,  # Keep for backward compatibility
        "roles_by_tenure": roles_dict,
        "member_type": member_type_enum.value,  # Store the string value
        "tenure": member_tenures,
        "bio": bio,
        "socials": socials.dict(),
        "skills": json.loads(skills) if skills else existing_member.get('skills', []),
        "projects": json.loads(projects) if projects else existing_member.get('projects', []),
        "experience": json.loads(experience) if experience else existing_member.get('experience', []),
        "education": json.loads(education) if education else existing_member.get('education', []),
        "image_url": image_url,
        "email": email.lower().strip() if email else existing_member.get('email'),  # Email for member portal
        "order_by_tenure": existing_order_by_tenure,  # Preserve existing order_by_tenure
        "updated_at": datetime.utcnow()
    }
    
    await db.members.update_one(
        {"_id": ObjectId(member_id)},
        {"$set": update_data}
    )
    
    updated_member = await db.members.find_one({"_id": ObjectId(member_id)})
    updated_member["id"] = str(updated_member["_id"])
    
    return TeamMemberInDB(**updated_member)

@router.delete("/members/{member_id}", status_code=204)
async def delete_member(member_id: str, db=Depends(get_misc_db)):
    result = await db.members.delete_one({"_id": ObjectId(member_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return None

@router.get("/team-members/", response_model=List[TeamMemberInDB])
async def get_team_members(db=Depends(get_misc_db)):
    return await get_all_members(member_type=MemberType.TEAM, db=db)

@router.get("/advisors/", response_model=List[TeamMemberInDB])
async def get_advisors(db=Depends(get_misc_db)):
    return await get_all_members(member_type=MemberType.ADVISOR, db=db)



@router.post("/team-members/reorder")
async def reorder_team_members(payload: TeamOrderRequest, db=Depends(get_misc_db)):
    """
    Update the order of team members by saving their new positions in the database per tenure.
    Expects a JSON object: { "order": [id1, id2, ...], "tenure": "2024-2025" }
    Stores order in order_by_tenure dict: { "2024-2025": 0, "2025-2026": 1, ... }
    """
    for idx, member_id in enumerate(payload.order):
        # Get the current member to preserve existing order_by_tenure
        member = await db.members.find_one({"_id": ObjectId(member_id)})
        if member:
            # Initialize order_by_tenure if it doesn't exist
            order_by_tenure = member.get("order_by_tenure", {})
            if not isinstance(order_by_tenure, dict):
                order_by_tenure = {}
            
            # Update the order for this specific tenure
            order_by_tenure[payload.tenure] = idx
            
            # Update the member with the new order_by_tenure
            await db.members.update_one(
                {"_id": ObjectId(member_id)}, 
                {"$set": {"order_by_tenure": order_by_tenure}}
            )
    return {"message": f"Team member order updated successfully for {payload.tenure}"}