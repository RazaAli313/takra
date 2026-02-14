from fastapi import HTTPException, Form, status, APIRouter, Depends
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
import logging
from typing import Optional, List
from backend.Schemas.Job import JobItem
from backend.config.database.init import get_misc_db


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/job", response_model=dict)
async def create_job(
    title: str = Form(...),
    company: str = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    description: str = Form(...),
    requirements: Optional[str] = Form(None),
    salary: Optional[str] = Form(None),
    apply_link: Optional[str] = Form(None),
    deadline: Optional[str] = Form(None),
    is_active: bool = Form(True),
    db=Depends(get_misc_db)
):
    try:
        # Validate input
        if not title or not title.strip():
            raise HTTPException(status_code=400, detail="Job title is required")
        if not company or not company.strip():
            raise HTTPException(status_code=400, detail="Company name is required")
        if not location or not location.strip():
            raise HTTPException(status_code=400, detail="Location is required")
        if type not in ["Full-time", "Part-time", "Internship", "Contract", "Freelance"]:
            raise HTTPException(status_code=400, detail="Invalid job type")
        if not description or not description.strip():
            raise HTTPException(status_code=400, detail="Job description is required")
        
        # Create new job
        new_job = {
            "id": str(uuid.uuid4()),
            "title": title.strip(),
            "company": company.strip(),
            "location": location.strip(),
            "type": type,
            "description": description.strip(),
            "requirements": requirements.strip() if requirements else None,
            "salary": salary.strip() if salary else None,
            "apply_link": apply_link.strip() if apply_link else None,
            "posted_date": datetime.utcnow().isoformat(),
            "deadline": deadline.strip() if deadline else None,
            "is_active": is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = await db.jobs.insert_one(new_job)
        new_job["_id"] = str(result.inserted_id)
        new_job["created_at"] = new_job["created_at"].isoformat()
        new_job["updated_at"] = new_job["updated_at"].isoformat()
        
        return {
            "message": "Job posted successfully",
            "job": new_job,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/job", response_model=List[JobItem])
async def get_active_jobs(
    type: Optional[str] = None,
    location: Optional[str] = None,
    db=Depends(get_misc_db)
):
    """Get all active jobs, optionally filtered by type and location"""
    try:
        query = {"is_active": True}
        
        if type:
            query["type"] = type
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        
        jobs = []
        async for job in db.jobs.find(query).sort("created_at", -1):
            job["_id"] = str(job["_id"])
            if isinstance(job.get("created_at"), datetime):
                job["created_at"] = job["created_at"].isoformat()
            if isinstance(job.get("updated_at"), datetime):
                job["updated_at"] = job["updated_at"].isoformat()
            jobs.append(job)
        
        return jobs
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/job/all", response_model=List[JobItem])
async def get_all_jobs(db=Depends(get_misc_db)):
    """Get all jobs (for admin panel)"""
    try:
        jobs = []
        async for job in db.jobs.find().sort("created_at", -1):
            job["_id"] = str(job["_id"])
            if isinstance(job.get("created_at"), datetime):
                job["created_at"] = job["created_at"].isoformat()
            if isinstance(job.get("updated_at"), datetime):
                job["updated_at"] = job["updated_at"].isoformat()
            jobs.append(job)
        
        return jobs
    except Exception as e:
        logger.error(f"Error fetching all jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/job/{job_id}", response_model=JobItem)
async def get_job_by_id(job_id: str, db=Depends(get_misc_db)):
    """Get a specific job by ID"""
    try:
        job = await db.jobs.find_one({"id": job_id})
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job["_id"] = str(job["_id"])
        if isinstance(job.get("created_at"), datetime):
            job["created_at"] = job["created_at"].isoformat()
        if isinstance(job.get("updated_at"), datetime):
            job["updated_at"] = job["updated_at"].isoformat()
        
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/job/{job_id}", response_model=dict)
async def update_job(
    job_id: str,
    title: Optional[str] = Form(None),
    company: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    requirements: Optional[str] = Form(None),
    salary: Optional[str] = Form(None),
    apply_link: Optional[str] = Form(None),
    deadline: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    db=Depends(get_misc_db)
):
    try:
        # Check if job exists
        existing_job = await db.jobs.find_one({"id": job_id})
        if not existing_job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        update_data = {"updated_at": datetime.utcnow()}
        
        # Update fields if provided
        if title is not None:
            if not title.strip():
                raise HTTPException(status_code=400, detail="Job title cannot be empty")
            update_data["title"] = title.strip()
        
        if company is not None:
            if not company.strip():
                raise HTTPException(status_code=400, detail="Company name cannot be empty")
            update_data["company"] = company.strip()
        
        if location is not None:
            update_data["location"] = location.strip()
        
        if type is not None:
            if type not in ["Full-time", "Part-time", "Internship", "Contract", "Freelance"]:
                raise HTTPException(status_code=400, detail="Invalid job type")
            update_data["type"] = type
        
        if description is not None:
            update_data["description"] = description.strip()
        
        if requirements is not None:
            update_data["requirements"] = requirements.strip() if requirements else None
        
        if salary is not None:
            update_data["salary"] = salary.strip() if salary else None
        
        if apply_link is not None:
            update_data["apply_link"] = apply_link.strip() if apply_link else None
        
        if deadline is not None:
            update_data["deadline"] = deadline.strip() if deadline else None
        
        if is_active is not None:
            update_data["is_active"] = is_active
        
        # Update in MongoDB
        result = await db.jobs.update_one(
            {"id": job_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes were made")
        
        # Fetch updated job
        updated_job = await db.jobs.find_one({"id": job_id})
        updated_job["_id"] = str(updated_job["_id"])
        if isinstance(updated_job.get("created_at"), datetime):
            updated_job["created_at"] = updated_job["created_at"].isoformat()
        if isinstance(updated_job.get("updated_at"), datetime):
            updated_job["updated_at"] = updated_job["updated_at"].isoformat()
        
        return {
            "message": "Job updated successfully",
            "job": updated_job,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/job/{job_id}")
async def delete_job(job_id: str, db=Depends(get_misc_db)):
    try:
        # Delete from MongoDB
        result = await db.jobs.delete_one({"id": job_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "message": "Job deleted successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

