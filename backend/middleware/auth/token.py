import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import Request, HTTPException,Depends
from pydantic import BaseModel,EmailStr
from backend.config.database.init import __init__
from fastapi import APIRouter
import datetime
from passlib.context import CryptContext
from backend.config.limiter import _limiter as limiter
from backend.config.database.init import get_misc_db
from jose import jwt
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")

router=APIRouter()

db = __init__("misc")  # Use the misc database for OTPs


@router.post('/auth/verifyTokens')
@limiter.limit("200/day")
async def verify_tokens(request: Request):
    admin_token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    master_token = request.headers.get("masterAuthToken") or request.cookies.get("masterAuthToken")
    if not admin_token or not master_token:
        raise HTTPException(status_code=401, detail="Missing one or both tokens")
    try:
        admin_payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[os.getenv("JWT_ALGORITHM")])
        master_payload = jwt.decode(master_token, SECRET_KEY, algorithms=[os.getenv("JWT_ALGORITHM")])
        return {"valid": True, "admin": admin_payload, "master": master_payload}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token(s)")


@router.post("/auth/getToken")
@limiter.limit("200/day")
async def get_token(request: Request):
    # print("called")
    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    token = jwt.encode({"user_agent": user_agent, "ip_address": ip_address, "exp": exp}, SECRET_KEY, algorithm=os.getenv("JWT_ALGORITHM"))
    return {"token": token}

@router.post('/auth/verify' \
'Token')
@limiter.limit("200/day")
async def verify_token(request:Request):
    token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    logger = __import__('logging').getLogger(__name__)
    logger.info(f'verify_token called; token_present={bool(token)} client={getattr(request.client, "host", None)}')
    if not token:
        logger.warning('verify_token: missing token')
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        logger.debug(f'verify_token: token decoded payload_keys={list(payload.keys())}')
        return {"valid": True, "payload": payload}
    except Exception as e:
        logger.exception('verify_token: invalid or expired token')
        raise HTTPException(status_code=401, detail="Invalid or expired token")

class AdminLoginRequest(BaseModel):
    email: str
    password: str



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/admin/auth/login")
@limiter.limit("200/day")
async def admin_login(request:Request,data: AdminLoginRequest, db=Depends(get_misc_db)):
    # Support both email and username login
    # Check if input is email or username
    username_or_email = data.email.strip()
    
    # Try to find admin by username or email
    admin_doc = None
    # First try to find by username
    admin_doc = await db["admin"].find_one({"username": username_or_email})
    # If not found, try by email
    if not admin_doc:
        admin_doc = await db["admin"].find_one({"email": username_or_email})
    # If still not found, try the old way (single admin document)
    if not admin_doc:
        admin_doc = await db["admin"].find_one({})
    
    if not admin_doc:
        raise HTTPException(status_code=401, detail="Admin not found")
    
    # Check if password exists
    if "password" not in admin_doc:
        raise HTTPException(status_code=401, detail="Password not set for this admin")
    
    stored_hash = admin_doc["password"]
    if not pwd_context.verify(data.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Issue JWT token with username or email
    identifier = admin_doc.get("username") or admin_doc.get("email") or username_or_email
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    token = jwt.encode({"email": identifier, "username": identifier, "exp": exp}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "message": "Login successful"}