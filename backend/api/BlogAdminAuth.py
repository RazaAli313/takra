import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import Request, HTTPException, Depends, Body
from pydantic import BaseModel
from backend.config.database.init import __init__
from fastapi import APIRouter
import datetime
from passlib.context import CryptContext
from backend.config.limiter import _limiter as limiter
from backend.config.database.init import get_misc_db
from jose import jwt
from backend.middleware.auth.otp import send_otp_email

SECRET_KEY = os.getenv("JWT_SECRET")
BLOG_ADMIN_EMAILS = [
    "contact@taakra2026.com",
    "razaalipk313@gmail.com"
]

router = APIRouter()

db = __init__("misc")  # Use the misc database for blog admin

class BlogAdminLoginRequest(BaseModel):
    username: str
    password: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/blogadmin/auth/login")
@limiter.limit("200/day")
async def blogadmin_login(request: Request, data: BlogAdminLoginRequest, db=Depends(get_misc_db)):
    # Find blog admin user by username
    username = data.username.strip()
    admin_doc = await db["blog_admin"].find_one({"username": username})
    
    if not admin_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if password exists
    if "password" not in admin_doc:
        raise HTTPException(status_code=401, detail="Password not set for this admin")
    
    stored_hash = admin_doc["password"]
    if not pwd_context.verify(data.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Issue JWT token
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    token = jwt.encode({"username": username, "type": "blogadmin", "exp": exp}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "message": "Login successful"}


def verify_blogadmin_token(request: Request):
    """Dependency function to verify blog admin token"""
    token = (request.query_params.get("token") or 
             request.headers.get("blogAdminAuthToken") or 
             request.cookies.get("blogAdminAuthToken"))
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # Verify it's a blog admin token
        if payload.get("type") != "blogadmin":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post('/blogadmin/auth/verify')
@limiter.limit("200/day")
async def verify_blogadmin_token_endpoint(request: Request):
    token = request.headers.get("blogAdminAuthToken") or request.cookies.get("blogAdminAuthToken")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # Verify it's a blog admin token
        if payload.get("type") != "blogadmin":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"valid": True, "payload": payload}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class BlogSubmissionStatus(BaseModel):
    open: bool


@router.get("/blogadmin/submissions/status")
async def get_blog_submission_status_admin(request: Request, db=Depends(get_misc_db), auth=Depends(verify_blogadmin_token)):
    """Get blog submission registration status (blog admin endpoint)."""
    settings = await db.settings.find_one({'_id': 'blog_submissions'})
    if not settings:
        return {'open': True}  # Default to open
    return {'open': bool(settings.get('open', True))}


@router.post("/blogadmin/submissions/status")
async def set_blog_submission_status_admin(
    payload: BlogSubmissionStatus = Body(...),
    request: Request = None,
    db=Depends(get_misc_db),
    auth=Depends(verify_blogadmin_token)
):
    """Set blog submission registration status (blog admin endpoint)."""
    await db.settings.update_one(
        {'_id': 'blog_submissions'},
        {'$set': {'open': bool(payload.open), 'updated_at': datetime.utcnow()}},
        upsert=True
    )
    return {'open': bool(payload.open)}


class OTPRequest(BaseModel):
    otp: int


@router.post("/blogadmin/otp/generate")
@limiter.limit("15/day")
async def generate_blogadmin_otp(request: Request, db=Depends(get_misc_db), auth=Depends(verify_blogadmin_token)):
    # Generate random 6-digit OTP
    import random
    otp = random.randint(100000, 999999)
    
    # Get client IP address
    ip_address = request.client.host if request.client else "unknown"
    
    # Get device info from user agent
    user_agent_str = request.headers.get("user-agent", "")
    try:
        import user_agents
        user_agent = user_agents.parse(user_agent_str)
        device_info = f"{user_agent.browser.family} on {user_agent.os.family}"
    except:
        device_info = user_agent_str[:50] if user_agent_str else "unknown"
    
    # Remove any previous OTPs
    await db["blog_admin_otps"].delete_many({})
    
    # Store the OTP
    await db["blog_admin_otps"].insert_one({
        "otp": otp,
        "created_at": datetime.datetime.utcnow(),
        "ip_address": ip_address,
        "device_info": device_info
    })
    
    # Debug logging
    print(f"[DEBUG] Generated OTP: {otp} (type: {type(otp)})")
    print(f"[DEBUG] Stored OTP in database")
    
    # Send OTP via email to all blog admin emails
    email_errors = []
    for email in BLOG_ADMIN_EMAILS:
        try:
            await send_otp_email(str(otp), email, ip_address, device_info, template_type="admin")
            print(f"[DEBUG] OTP email sent successfully to {email}")
        except Exception as e:
            error_msg = f"Error sending OTP email to {email}: {e}"
            print(error_msg)
            email_errors.append(error_msg)
            # Continue sending to other emails even if one fails
    
    if email_errors:
        # Log errors but don't fail the request
        print(f"[WARNING] Some emails failed to send: {email_errors}")
    
    return {"message": f"OTP generated and sent to {len(BLOG_ADMIN_EMAILS)} email address(es)"}


@router.post("/blogadmin/otp/verify")
@limiter.limit("15/day")
async def verify_blogadmin_otp(request: Request, otp_data: OTPRequest, db=Depends(get_misc_db), auth=Depends(verify_blogadmin_token)):
    # Debug logging
    print(f"[DEBUG] Verifying OTP - Provided: {otp_data.otp} (type: {type(otp_data.otp)})")
    
    # Since we delete all OTPs before inserting a new one, there should only be one OTP
    # Use find_one with sort to get the latest (matching CogentLabsAuth pattern)
    stored_otp = await db["blog_admin_otps"].find_one(
        {},
        sort=[("created_at", -1)]
    )

    if not stored_otp:
        print("[DEBUG] No OTP found in database")
        raise HTTPException(status_code=400, detail="No OTP found. Please generate a new OTP.")
    
    print(f"[DEBUG] Found stored OTP: {stored_otp.get('otp')} (type: {type(stored_otp.get('otp'))})")
    print(f"[DEBUG] Stored OTP created at: {stored_otp.get('created_at')}")
    
    # Check if expired (5 minutes)
    time_diff = (datetime.datetime.utcnow() - stored_otp["created_at"]).total_seconds()
    print(f"[DEBUG] Time difference: {time_diff} seconds")
    if time_diff > 300:
        await db["blog_admin_otps"].delete_many({})
        raise HTTPException(status_code=400, detail="OTP expired. Please generate a new OTP.")
    
    # Check if OTP matches - compare both as integers to avoid type issues
    stored_otp_value = int(stored_otp.get("otp", 0))
    provided_otp_value = int(otp_data.otp)
    
    print(f"[DEBUG] Comparing - Stored: {stored_otp_value} (type: {type(stored_otp_value)}), Provided: {provided_otp_value} (type: {type(provided_otp_value)})")
    
    if stored_otp_value != provided_otp_value:
        # Debug logging
        print(f"[DEBUG] OTP Mismatch!")
        print(f"[DEBUG] Full stored_otp document: {stored_otp}")
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")

    # OTP is valid → remove it
    print("[DEBUG] OTP verified successfully!")
    await db["blog_admin_otps"].delete_many({})

    return {"message": "OTP verified successfully"}


class BlogSubmissionStatus(BaseModel):
    open: bool


@router.get("/blogadmin/submissions/status")
async def get_blog_submission_status_admin(request: Request, db=Depends(get_misc_db), auth=Depends(verify_blogadmin_token)):
    """Get blog submission registration status (blog admin endpoint)."""
    settings = await db.settings.find_one({'_id': 'blog_submissions'})
    if not settings:
        return {'open': True}  # Default to open
    return {'open': bool(settings.get('open', True))}


@router.post("/blogadmin/submissions/status")
async def set_blog_submission_status_admin(
    payload: BlogSubmissionStatus = Body(...),
    request: Request = None,
    db=Depends(get_misc_db),
    auth=Depends(verify_blogadmin_token)
):
    """Set blog submission registration status (blog admin endpoint)."""
    await db.settings.update_one(
        {'_id': 'blog_submissions'},
        {'$set': {'open': bool(payload.open), 'updated_at': datetime.utcnow()}},
        upsert=True
    )
    return {'open': bool(payload.open)}

