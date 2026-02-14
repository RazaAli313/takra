
from fastapi import Request, HTTPException
from jose import jwt, JWTError
import os
from fastapi import Depends
import random
from pydantic import  EmailStr
from backend.config.database.init import get_misc_db
from fastapi import APIRouter
import datetime
from dotenv import load_dotenv
import user_agents
from pathlib import Path
import smtplib
from jinja2 import Template
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from backend.config.limiter import _limiter as limiter

from fastapi import Depends
load_dotenv()
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
router = APIRouter()
from jose import jwt
from fastapi import Request, HTTPException,Depends
import random
from pydantic import EmailStr
from backend.config.database.init import get_misc_db
from fastapi import APIRouter
import datetime
from dotenv import load_dotenv
import user_agents
from pathlib import Path
import os
from backend.Schemas.OTP import OTPAdmin
import smtplib
from jinja2 import Template
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")

def verify_admin_tokens(request: Request):
    admin_token = request.cookies.get("adminAuthToken") or request.headers.get("adminAuthToken")
    master_token = request.cookies.get("masterAuthToken") or request.headers.get("masterAuthToken")
    print(f"[DEBUG] Received adminAuthToken: {admin_token}")
    print(f"[DEBUG] Received masterAuthToken: {master_token}")
    if not admin_token or not master_token:
        print("[DEBUG] Missing one or both tokens")
        raise HTTPException(status_code=401, detail="Missing tokens")
    try:
        jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        print(f"[DEBUG] Admin token decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid admin token")
    try:
        jwt.decode(master_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        print(f"[DEBUG] Master token decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid master token")


load_dotenv()
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")


## Removed top-level db assignment. Use dependency injection instead.

router = APIRouter()

async def send_otp_email(otp: str, recipient_email: str, ip_address: str, device_info: str, template_type: str = "admin"):
    print("OTP Email sending")
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    receiver_email = recipient_email

    # Choose template based on type
    # Use __file__ to get the correct path relative to this file
    # File is at: backend/middleware/auth/otp.py
    # Need to go up 3 levels to get to backend/, then into templates/
    base_path = Path(__file__).parent.parent.parent
    if template_type == "comment":
        template_path = base_path / "templates" / "otp_comment_template.html"
        subject = "Your Comment Verification Code - FCIT Developers Club"
        expiry_time = "5 minutes"
    elif template_type == "blog_submission":
        template_path = base_path / "templates" / "otp_blog_submission_template.html"
        subject = "Blog Submission Verification Code - FCIT Developers Club"
        expiry_time = "5 minutes"
    else:  # admin
        template_path = base_path / "templates" / "otp_admin_template.html"
        subject = "Your OTP Verification Code - FCIT Developers Club"
        expiry_time = "1 minute"
    
    if not template_path.exists():
        # Fallback to a simple template if file not found
        print(f"[WARNING] Template not found at: {template_path.absolute()}")
        html_content = f"""
        <html>
        <body>
            <h2>OTP Verification - FCIT Developers Club</h2>
            <p><strong>Your OTP code:</strong> {otp}</p>
            <p><strong>Request Time:</strong> {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>IP Address:</strong> {ip_address}</p>
            <p><strong>Device:</strong> {device_info}</p>
            <p>This code will expire in {expiry_time}.</p>
        </body>
        </html>
        """
    else:
        print(f"[INFO] Loading template from: {template_path.absolute()}")
        with open(template_path, 'r') as file:
            template_content = file.read()
        
        # Create Jinja2 template
        template = Template(template_content)
        
        # Render template with variables
        html_content = template.render(
            otp=otp,
            timestamp=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            ip_address=ip_address,
            device_info=device_info,
            year=datetime.datetime.utcnow().year
        )
        print(f"[INFO] Template rendered successfully for type: {template_type}")

    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = receiver_email

    # Create the plain-text version of your message
    text = f"""
    FCIT Developers Club - OTP Verification
    
    Your verification code: {otp}
    
    This code will expire in {expiry_time}.
    
    Request Details:
    - Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    - IP Address: {ip_address}
    - Device: {device_info}
    
    If you didn't request this code, please ignore this email or contact our support team immediately.
    
    © {datetime.datetime.now().year} FCIT Developers Club. All rights reserved.
    """

    # Turn these into plain/html MIMEText objects
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html_content, "html")

    # Add HTML/plain-text parts to MIMEMultipart message
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("OTP Email sent successfully!")
        return True
    except Exception as e:
        print("Error sending OTP email:", e)
        return False



@router.post("/admin/otp/generate")
@limiter.limit("15/day")
async def generate_otp(request: Request, db=Depends(get_misc_db), _: None = Depends(verify_admin_tokens)):
    # Get client IP address
    ip_address = request.client.host
    
    # Get user agent string
    user_agent_str = request.headers.get("user-agent", "")
    
    # Parse user agent to get device info
    user_agent = user_agents.parse(user_agent_str)
    device_info = f"{user_agent.browser.family} on {user_agent.os.family}"
    
    # Generate OTP
    otp = random.randint(100000, 999999)

    # Remove any previous OTPs so only the latest one exists
    await db["otps"].delete_many({})

    # Store the new OTP
    await db["otps"].insert_one({
        "otp": otp,
        "created_at": datetime.datetime.utcnow(),
        "ip_address": ip_address,
        "device_info": device_info
    })
    
    # Send OTP email
    await send_otp_email(otp, ADMIN_EMAIL, ip_address, device_info)

    return {"otp": otp}

# @router.post("/admin/otp/generate",status_code=201)
# async def generate_otp():
#     otp = random.randint(100000, 999999)
     
#     # Remove any previous OTPs so only the latest one exists
#     await db["otps"].delete_many({})

#     # Store the new OTP
#     await db["otps"].insert_one({
#         "otp": otp,
#         "created_at": datetime.datetime.utcnow()
#     })

#     return {"otp": otp}



@router.post("/admin/otp/verify")
@limiter.limit("15/day")
async def verify_otp(request:Request,otp: OTPAdmin, db=Depends(get_misc_db), _: None = Depends(verify_admin_tokens)):
    # Get the latest OTP
    stored_otp = await db["otps"].find_one(
        {},
        sort=[("created_at", -1)]
    )

    if (
        not stored_otp
        or stored_otp["otp"] != otp.otp
        or (datetime.datetime.utcnow() - stored_otp["created_at"]).total_seconds() > 60
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # OTP is valid → remove it
    await db["otps"].delete_many({})

    return {"message": "OTP verified successfully"}

@router.get("/otp/generate")
@limiter.limit("20/day")
async def generate_otp(request:Request, email: EmailStr, db=Depends(get_misc_db)):
    otp = random.randint(100000, 999999)
    
    # Remove any previous OTPs for this email
    await db["otps"].delete_many({"email": email})
    
    # Store OTP in the database with the user's email
    await db["otps"].insert_one({"email": email, "otp": otp, "created_at": datetime.datetime.utcnow()})
    
    # Get client IP address and device info
    ip_address = request.client.host if request.client else "unknown"
    user_agent_str = request.headers.get("user-agent", "")
    try:
        import user_agents
        user_agent = user_agents.parse(user_agent_str)
        device_info = f"{user_agent.browser.family} on {user_agent.os.family}"
    except:
        device_info = user_agent_str[:50] if user_agent_str else "unknown"
    
    # Send OTP email with comment template type
    await send_otp_email(str(otp), email, ip_address, device_info, template_type="comment")
    
    return {"messages": "OTP generated and sent successfully"}

@router.post("/otp/verify")
@limiter.limit("20/day")
async def verify_otp(request:Request,email: EmailStr, otp: int, db=Depends(get_misc_db)):
    # Check if the OTP is valid
    stored_otp = await db["otps"].find_one({"email": email})
    if not stored_otp or stored_otp["otp"] != otp or (datetime.datetime.utcnow() - stored_otp["created_at"]).total_seconds() > 300:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    # If valid, delete the OTP from the database
    await db["otps"].delete_one({"email": email})
    return {"message": "OTP verified successfully..."}
