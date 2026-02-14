import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import Request, HTTPException, Depends
from pydantic import BaseModel
from backend.config.database.init import __init__
from fastapi import APIRouter
import datetime
from passlib.context import CryptContext
from backend.config.limiter import _limiter as limiter
from backend.config.database.init import get_misc_db
from jose import jwt

SECRET_KEY = os.getenv("JWT_SECRET")

router = APIRouter()

db = __init__("misc")  # Use the misc database for Cogent Labs admin

class CogentLabsLoginRequest(BaseModel):
    username: str
    password: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/cogentlabs/auth/login")
@limiter.limit("200/day")
async def cogentlabs_login(request: Request, data: CogentLabsLoginRequest, db=Depends(get_misc_db)):
    # Find Cogent Labs admin user by username
    username = data.username.strip()
    admin_doc = await db["cogent_labs_admin"].find_one({"username": username})
    
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
    token = jwt.encode({"username": username, "type": "cogentlabs", "exp": exp}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "message": "Login successful"}


def verify_cogentlabs_token(request: Request):
    """Dependency function to verify Cogent Labs admin token"""
    # Try to get token from query params (for iframe), headers, or cookies
    token = (request.query_params.get("token") or 
             request.headers.get("cogentLabsAuthToken") or 
             request.cookies.get("cogentLabsAuthToken"))
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # Verify it's a Cogent Labs token
        if payload.get("type") != "cogentlabs":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post('/cogentlabs/auth/verify')
@limiter.limit("200/day")
async def verify_cogentlabs_token_endpoint(request: Request):
    token = request.headers.get("cogentLabsAuthToken") or request.cookies.get("cogentLabsAuthToken")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        # Verify it's a Cogent Labs token
        if payload.get("type") != "cogentlabs":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"valid": True, "payload": payload}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class OTPRequest(BaseModel):
    otp: int


@router.post("/cogentlabs/otp/generate")
@limiter.limit("15/day")
async def generate_cogentlabs_otp(request: Request, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    # Store hardcoded OTP 555555 in database
    # Remove any previous OTPs
    await db["cogent_labs_otps"].delete_many({})
    
    # Store the hardcoded OTP
    await db["cogent_labs_otps"].insert_one({
        "otp": 555555,
        "created_at": datetime.datetime.utcnow(),
        "ip_address": request.client.host,
        "device_info": request.headers.get("user-agent", "")
    })
    
    return {"message": "OTP generated successfully", "otp": 555555}


@router.post("/cogentlabs/otp/verify")
@limiter.limit("15/day")
async def verify_cogentlabs_otp(request: Request, otp_data: OTPRequest, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    # Get the latest OTP
    stored_otp = await db["cogent_labs_otps"].find_one(
        {},
        sort=[("created_at", -1)]
    )

    if (
        not stored_otp
        or stored_otp["otp"] != otp_data.otp
        or (datetime.datetime.utcnow() - stored_otp["created_at"]).total_seconds() > 300  # 5 minutes expiry
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # OTP is valid → remove it
    await db["cogent_labs_otps"].delete_many({})

    return {"message": "OTP verified successfully"}

