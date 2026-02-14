from fastapi import APIRouter, HTTPException, Depends, Request, File, UploadFile, Form
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import re
from backend.config.database.init import get_misc_db
from backend.utils.CloudinaryFileUploader import save_uploaded_file
import httpx

router = APIRouter()


class CogentLabsRegistrationIn(BaseModel):
    name: str = Field(...)
    cnic: str = Field(...)
    email: EmailStr = Field(...)
    phone: str = Field(...)
    batch: str = Field(...)
    campus: str = Field(...)
    why_join: str = Field(...)
    comments: Optional[str] = None


@router.post('/register')
async def submit_registration(
    request: Request,
    name: str = Form(...),
    cnic: str = Form(...),
    email: EmailStr = Form(...),
    phone: str = Form(...),
    batch: str = Form(...),
    campus: str = Form(...),
    why_join: str = Form(...),
    comments: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    db=Depends(get_misc_db)
):
    # Basic server-side validation
    if not name.strip():
        raise HTTPException(status_code=400, detail='Name is required')

    # CNIC: accept 13 digits or pattern 5-7-1 with dashes
    cnic_digits = re.sub(r"\D", "", cnic or "")
    if len(cnic_digits) != 13:
        raise HTTPException(status_code=400, detail='CNIC must contain 13 digits')

    # Phone validation: digits, 7-15 length
    phone_digits = re.sub(r"\D", "", phone or "")
    if len(phone_digits) < 7 or len(phone_digits) > 15:
        raise HTTPException(status_code=400, detail='Phone number seems invalid')

    if campus.lower() not in ('old', 'new'):
        raise HTTPException(status_code=400, detail="Campus must be 'old' or 'new'")

    # Check if registration is open
    s = await db.settings.find_one({'_id': 'cogent_labs_registrations'})
    if s and not s.get('open', True):
        raise HTTPException(status_code=403, detail='Registrations are currently closed')

    # Resume handling
    resume_url = None
    resume_name = None
    resume_public_id = None
    if resume:
        # Save resume via Cloudinary raw uploader
        resume_name = resume.filename
        upload_result = await save_uploaded_file(resume, file_type='resumes')
        # save returned url and public_id if available
        if isinstance(upload_result, dict):
            resume_url = upload_result.get('url')
            resume_public_id = upload_result.get('public_id')
        else:
            resume_url = upload_result

    doc = {
        'name': name.strip(),
        'cnic': cnic_digits,
        'email': str(email),
        'phone': phone_digits,
        'batch': batch.strip(),
        'campus': campus.lower(),
        'why_join': why_join.strip(),
        'comments': comments.strip() if comments else None,
        'resume_url': resume_url,
        'resume_filename': resume_name,
        'resume_public_id': resume_public_id,
        'created_at': datetime.utcnow()
    }

    res = await db.cogent_labs_registrations.insert_one(doc)
    rec = await db.cogent_labs_registrations.find_one({'_id': res.inserted_id})
    rec['id'] = str(rec['_id'])
    return {'ok': True, 'registration_id': rec['id']}


@router.get('/register/status')
async def get_registration_status(db=Depends(get_misc_db)):
    s = await db.settings.find_one({'_id': 'cogent_labs_registrations'})
    if not s:
        return {'open': True}
    return {'open': bool(s.get('open', True))}

