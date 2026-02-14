
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi import Body
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import Optional
from backend.config.database.init import get_misc_db
from datetime import datetime
from backend.middleware.auth.token import verify_token

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordChangeRequest(BaseModel):
    password: str

def truncate_password(password: str) -> str:
    while len(password.encode("utf-8")) > 72:
        password = password[:-1]
    return password

@router.post("/set-password")
async def set_admin_password(
    data: PasswordChangeRequest, 
    request: Request,
    db=Depends(get_misc_db),
    auth=Depends(verify_token)
):
    """Update admin password - requires authentication"""
    if not data.password or not data.password.strip():
        raise HTTPException(status_code=400, detail="Password cannot be empty")
    
    safe_password = truncate_password(data.password)
    hashed_password = pwd_context.hash(safe_password)

    # Extract username/email from token payload if available
    # The verify_token dependency returns {"valid": True, "payload": {...}}
    # But when used as dependency, FastAPI just checks it doesn't raise
    # So we need to decode the token again to get the payload
    token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    username_or_email = None
    if token:
        try:
            from jose import jwt
            import os
            SECRET_KEY = os.getenv("JWT_SECRET")
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            username_or_email = payload.get("username") or payload.get("email")
        except Exception:
            pass  # Token already verified by dependency
    
    # Build query to find the correct admin
    query = {}
    if username_or_email:
        # Try to find by username or email
        admin_doc = await db.admin.find_one({
            "$or": [
                {"username": username_or_email},
                {"email": username_or_email}
            ]
        })
        if admin_doc:
            query = {"_id": admin_doc["_id"]}
    
    # If no specific admin found, update any admin (backward compatibility)
    if not query:
        query = {}
    
    result = await db.admin.update_one(
        query, 
        {"$set": {"password": hashed_password, "updated_at": datetime.utcnow()}}, 
        upsert=True
    )

    if result.modified_count == 0 and result.upserted_id is None:
        raise HTTPException(status_code=500, detail="Password update failed")

    return {"message": "Password updated successfully"}


class RegistrationStatus(BaseModel):
    open: bool


@router.get('/registrations/status')
async def get_registrations_status(db=Depends(get_misc_db), auth=Depends(verify_token)):
    s = await db.settings.find_one({'_id': 'registrations'})
    return {'open': bool(s.get('open', True)) if s else True}


@router.post('/registrations/status')
async def set_registrations_status(payload: RegistrationStatus, db=Depends(get_misc_db), auth=Depends(verify_token)):
    await db.settings.update_one({'_id': 'registrations'}, {'$set': {'open': bool(payload.open), 'updated_at': datetime.utcnow()}}, upsert=True)
    return {'open': bool(payload.open)}


class SpreadsheetPayload(BaseModel):
    spreadsheet_url: Optional[str] = None
    spreadsheet_id: Optional[str] = None


@router.get('/registrations/spreadsheet')
async def get_registrations_spreadsheet(db=Depends(get_misc_db), auth=Depends(verify_token)):
    s = await db.settings.find_one({'_id': 'registrations_spreadsheet'})
    if not s:
        return {'spreadsheet_id': None}
    return {'spreadsheet_id': s.get('spreadsheet_id')}


@router.post('/registrations/spreadsheet')
async def set_registrations_spreadsheet(payload: SpreadsheetPayload = Body(...), db=Depends(get_misc_db), auth=Depends(verify_token)):
    # extract id if url provided
    sid = payload.spreadsheet_id
    if not sid and payload.spreadsheet_url:
        import re
        m = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', payload.spreadsheet_url)
        if m:
            sid = m.group(1)
        else:
            # try last segment
            try:
                sid = payload.spreadsheet_url.rstrip('/').split('/')[-1]
            except Exception:
                sid = None

    if not sid:
        raise HTTPException(status_code=400, detail='Invalid spreadsheet URL or ID')

    await db.settings.update_one({'_id': 'registrations_spreadsheet'}, {'$set': {'spreadsheet_id': sid, 'updated_at': datetime.utcnow()}}, upsert=True)
    return {'spreadsheet_id': sid}


@router.get('/delegations/status')
async def get_delegations_status(db=Depends(get_misc_db), auth=Depends(verify_token)):
    s = await db.settings.find_one({'_id': 'delegations'})
    return {'open': bool(s.get('open', True)) if s else True}


@router.post('/delegations/status')
async def set_delegations_status(payload: RegistrationStatus = Body(...), db=Depends(get_misc_db), auth=Depends(verify_token)):
    await db.settings.update_one({'_id': 'delegations'}, {'$set': {'open': bool(payload.open), 'updated_at': datetime.utcnow()}}, upsert=True)
    return {'open': bool(payload.open)}


# Blog submission registration status endpoints
@router.get('/blog-submissions/status')
async def get_blog_submission_status(db=Depends(get_misc_db), auth=Depends(verify_token)):
    s = await db.settings.find_one({'_id': 'blog_submissions'})
    return {'open': bool(s.get('open', True)) if s else True}


@router.post('/blog-submissions/status')
async def set_blog_submission_status(payload: RegistrationStatus, db=Depends(get_misc_db), auth=Depends(verify_token)):
    await db.settings.update_one({'_id': 'blog_submissions'}, {'$set': {'open': bool(payload.open), 'updated_at': datetime.utcnow()}}, upsert=True)
    return {'open': bool(payload.open)}
