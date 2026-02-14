"""
Member Portal Authentication API

This module handles authentication for team members who want to update their portfolios.
Features:
- OTP-based login (OTP sent to member's registered email)
- Password set/reset functionality
- JWT token-based session management
"""

import os
import random
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import EmailStr
from bson import ObjectId
from dotenv import load_dotenv

from backend.config.database.init import get_misc_db
from backend.config.limiter import _limiter as limiter
from backend.Schemas.Team import (
    MemberLoginRequest,
    MemberOTPVerifyRequest,
    MemberPasswordSetRequest,
    MemberPasswordResetRequest,
    MemberForgotPasswordRequest,
    MemberPortalProfile,
    MemberPortalUpdateRequest,
    SocialLinks
)

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
MEMBER_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def send_member_otp_email(otp: str, recipient_email: str, member_name: str, ip_address: str, device_info: str):
    """Send OTP email to member for portal login"""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from jinja2 import Template
    from pathlib import Path

    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")

    # Load template
    base_path = Path(__file__).parent.parent
    template_path = base_path / "templates" / "member_portal_otp.html"

    if template_path.exists():
        with open(template_path, 'r') as file:
            template_content = file.read()
        template = Template(template_content)
        html_content = template.render(
            otp=otp,
            member_name=member_name,
            timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            ip_address=ip_address,
            device_info=device_info,
            year=datetime.utcnow().year
        )
    else:
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Member Portal Login</h1>
                </div>
                <div style="padding: 30px;">
                    <p>Hello <strong>{member_name}</strong>,</p>
                    <p>You've requested to login to your Taakra 2026 Member Portal. Use the following verification code:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 10px; letter-spacing: 5px;">
                            {otp}
                        </div>
                        <p style="color: #666; margin-top: 10px;">This code will expire in 5 minutes</p>
                    </div>
                    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Request Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <p style="margin: 5px 0;"><strong>IP Address:</strong> {ip_address}</p>
                        <p style="margin: 5px 0;"><strong>Device:</strong> {device_info}</p>
                    </div>
                    <div style="background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Security notice:</strong> If you didn't request this code, please ignore this email.</p>
                    </div>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                    <p>© {datetime.utcnow().year} Taakra 2026. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Member Portal Login Code - Taakra 2026"
    msg["From"] = sender_email
    msg["To"] = recipient_email

    text = f"""
    Taakra 2026 - Member Portal Login

    Hello {member_name},

    Your verification code: {otp}

    This code will expire in 5 minutes.

    Request Details:
    - Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
    - IP Address: {ip_address}
    - Device: {device_info}

    If you didn't request this code, please ignore this email.

    © {datetime.utcnow().year} Taakra 2026. All rights reserved.
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        print(f"Member OTP Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending member OTP email: {e}")
        return False


async def send_password_reset_email(reset_token: str, recipient_email: str, member_name: str):
    """Send password reset link to member"""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from jinja2 import Template
    from pathlib import Path

    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    
    # Frontend URL for password reset
    frontend_url = os.getenv("FRONTEND_URL", "https://fdc-pucit.org")
    reset_link = f"{frontend_url}/member/reset-password?token={reset_token}"

    # Load template
    base_path = Path(__file__).parent.parent
    template_path = base_path / "templates" / "member_password_reset.html"

    if template_path.exists():
        with open(template_path, 'r') as file:
            template_content = file.read()
        template = Template(template_content)
        html_content = template.render(
            member_name=member_name,
            reset_link=reset_link,
            year=datetime.utcnow().year
        )
    else:
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Password Reset</h1>
                </div>
                <div style="padding: 30px;">
                    <p>Hello <strong>{member_name}</strong>,</p>
                    <p>You've requested to reset your password for the Taakra 2026 Member Portal.</p>
                    <p>Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; font-size: 18px; font-weight: bold; padding: 15px 40px; border-radius: 8px; text-decoration: none;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                    <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
                    <p style="word-break: break-all; background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 12px;">{reset_link}</p>
                    <div style="background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Security notice:</strong> If you didn't request this password reset, please ignore this email.</p>
                    </div>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                    <p>© {datetime.utcnow().year} Taakra 2026. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset - Taakra 2026 Member Portal"
    msg["From"] = sender_email
    msg["To"] = recipient_email

    text = f"""
    Taakra 2026 - Password Reset

    Hello {member_name},

    You've requested to reset your password for the Member Portal.

    Click here to reset your password: {reset_link}

    This link will expire in 1 hour.

    If you didn't request this, please ignore this email.

    © {datetime.utcnow().year} Taakra 2026. All rights reserved.
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        print(f"Password reset email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


def create_member_token(member_id: str, email: str) -> str:
    """Create JWT token for member"""
    exp = datetime.utcnow() + timedelta(minutes=MEMBER_TOKEN_EXPIRE_MINUTES)
    payload = {
        "member_id": member_id,
        "email": email,
        "exp": exp,
        "type": "member_portal"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_member_token(token: str) -> Optional[dict]:
    """Verify member JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "member_portal":
            return None
        return payload
    except JWTError:
        return None


async def get_current_member(request: Request, db=Depends(get_misc_db)):
    """Dependency to get current authenticated member"""
    token = request.headers.get("memberAuthToken") or request.cookies.get("memberAuthToken")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_member_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    member = await db.members.find_one({"_id": ObjectId(payload["member_id"])})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return member


@router.post("/member/auth/login")
@limiter.limit("10/minute")
async def member_login(request: Request, data: MemberLoginRequest, db=Depends(get_misc_db)):
    """
    Member login - sends OTP to registered email.
    The email must be registered with a team member in the admin panel.
    """
    import user_agents
    
    # Find member by email
    member = await db.members.find_one({"email": data.email.lower()})
    if not member:
        raise HTTPException(status_code=404, detail="No member found with this email. Please contact admin to register your email.")
    
    # Get client info
    ip_address = request.client.host if request.client else "unknown"
    user_agent_str = request.headers.get("user-agent", "")
    try:
        ua = user_agents.parse(user_agent_str)
        device_info = f"{ua.browser.family} on {ua.os.family}"
    except:
        device_info = user_agent_str[:50] if user_agent_str else "unknown"
    
    # Generate OTP
    otp = random.randint(100000, 999999)
    
    # Store OTP in database
    await db["member_otps"].delete_many({"email": data.email.lower()})
    await db["member_otps"].insert_one({
        "email": data.email.lower(),
        "otp": otp,
        "member_id": str(member["_id"]),
        "created_at": datetime.utcnow(),
        "ip_address": ip_address,
        "device_info": device_info
    })
    
    # Send OTP email
    await send_member_otp_email(
        str(otp),
        data.email,
        member.get("name", "Member"),
        ip_address,
        device_info
    )
    
    return {"message": "OTP sent to your email", "email": data.email}


@router.post("/member/auth/verify-otp")
@limiter.limit("10/minute")
async def member_verify_otp(request: Request, data: MemberOTPVerifyRequest, db=Depends(get_misc_db)):
    """
    Verify OTP and return authentication token.
    If member hasn't set password yet, they will be prompted to set one.
    """
    # Find OTP record
    otp_record = await db["member_otps"].find_one({"email": data.email.lower()})
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    # Check OTP expiration (5 minutes)
    if (datetime.utcnow() - otp_record["created_at"]).total_seconds() > 300:
        await db["member_otps"].delete_many({"email": data.email.lower()})
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Verify OTP
    if otp_record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Delete used OTP
    await db["member_otps"].delete_many({"email": data.email.lower()})
    
    # Get member
    member = await db.members.find_one({"email": data.email.lower()})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Check if member has set password
    has_password = bool(member.get("password_hash"))
    
    # Update member to mark portal access
    await db.members.update_one(
        {"_id": member["_id"]},
        {"$set": {"has_portal_access": True, "updated_at": datetime.utcnow()}}
    )
    
    # Create token
    token = create_member_token(str(member["_id"]), data.email.lower())
    
    return {
        "message": "OTP verified successfully",
        "token": token,
        "needs_password_setup": not has_password,
        "member_id": str(member["_id"]),
        "name": member.get("name", "")
    }


@router.post("/member/auth/set-password")
@limiter.limit("5/minute")
async def member_set_password(request: Request, data: MemberPasswordSetRequest, db=Depends(get_misc_db)):
    """
    Set password for member portal access.
    Requires valid member token or recent OTP verification.
    """
    # Get token from header
    token = request.headers.get("memberAuthToken") or request.cookies.get("memberAuthToken")
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = verify_member_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Verify email matches token
    if payload.get("email") != data.email.lower():
        raise HTTPException(status_code=403, detail="Email does not match authenticated user")
    
    # Hash password and update member
    password_hash = pwd_context.hash(data.password)
    result = await db.members.update_one(
        {"email": data.email.lower()},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Password set successfully"}


@router.post("/member/auth/login-password")
@limiter.limit("10/minute")
async def member_login_with_password(request: Request, db=Depends(get_misc_db)):
    """
    Login with email and password (alternative to OTP).
    """
    body = await request.json()
    email = body.get("email", "").lower()
    password = body.get("password", "")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Find member
    member = await db.members.find_one({"email": email})
    if not member:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    password_hash = member.get("password_hash")
    if not password_hash:
        raise HTTPException(status_code=400, detail="Password not set. Please use OTP login first.")
    
    if not pwd_context.verify(password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_member_token(str(member["_id"]), email)
    
    return {
        "message": "Login successful",
        "token": token,
        "member_id": str(member["_id"]),
        "name": member.get("name", "")
    }


@router.post("/member/auth/forgot-password")
@limiter.limit("5/hour")
async def member_forgot_password(request: Request, data: MemberForgotPasswordRequest, db=Depends(get_misc_db)):
    """
    Request password reset link.
    Sends an email with reset link if member exists.
    """
    # Find member
    member = await db.members.find_one({"email": data.email.lower()})
    if not member:
        # Don't reveal if email exists
        return {"message": "If the email is registered, a password reset link will be sent."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Store reset token
    await db["member_password_resets"].delete_many({"email": data.email.lower()})
    await db["member_password_resets"].insert_one({
        "email": data.email.lower(),
        "token": reset_token,
        "member_id": str(member["_id"]),
        "created_at": datetime.utcnow()
    })
    
    # Send reset email
    await send_password_reset_email(
        reset_token,
        data.email,
        member.get("name", "Member")
    )
    
    return {"message": "If the email is registered, a password reset link will be sent."}


@router.post("/member/auth/reset-password")
@limiter.limit("5/hour")
async def member_reset_password(request: Request, data: MemberPasswordResetRequest, db=Depends(get_misc_db)):
    """
    Reset password using the token from email.
    """
    # Find reset token
    reset_record = await db["member_password_resets"].find_one({"token": data.token})
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    # Check expiration (1 hour)
    if (datetime.utcnow() - reset_record["created_at"]).total_seconds() > 3600:
        await db["member_password_resets"].delete_one({"token": data.token})
        raise HTTPException(status_code=400, detail="Reset link expired. Please request a new one.")
    
    # Hash new password and update
    password_hash = pwd_context.hash(data.new_password)
    result = await db.members.update_one(
        {"email": reset_record["email"]},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Delete used reset token
    await db["member_password_resets"].delete_one({"token": data.token})
    
    return {"message": "Password reset successfully. You can now login with your new password."}


@router.post("/member/auth/verify")
@limiter.limit("100/minute")
async def verify_member_auth(request: Request, db=Depends(get_misc_db)):
    """
    Verify member authentication token.
    """
    token = request.headers.get("memberAuthToken") or request.cookies.get("memberAuthToken")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    payload = verify_member_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Verify member still exists
    member = await db.members.find_one({"_id": ObjectId(payload["member_id"])})
    if not member:
        raise HTTPException(status_code=401, detail="Member not found")
    
    return {
        "valid": True,
        "member_id": payload["member_id"],
        "email": payload["email"],
        "name": member.get("name", "")
    }


@router.get("/member/profile")
@limiter.limit("60/minute")
async def get_member_profile(request: Request, db=Depends(get_misc_db)):
    """
    Get current member's profile for editing.
    """
    member = await get_current_member(request, db)
    
    return MemberPortalProfile(
        id=str(member["_id"]),
        name=member.get("name", ""),
        email=member.get("email"),
        role=member.get("role"),
        roles_by_tenure=member.get("roles_by_tenure"),
        member_type=member.get("member_type", "team"),
        tenure=member.get("tenure"),
        bio=member.get("bio", ""),
        socials=member.get("socials"),
        skills=member.get("skills", []),
        projects=member.get("projects", []),
        experience=member.get("experience", []),
        education=member.get("education", []),
        image_url=member.get("image_url")
    )


@router.put("/member/profile")
@limiter.limit("30/minute")
async def update_member_profile(request: Request, db=Depends(get_misc_db)):
    """
    Update member's portfolio information.
    Members can only update their bio, socials, skills, projects, experience, and education.
    """
    member = await get_current_member(request, db)
    body = await request.json()
    
    # Only allow updating specific fields
    allowed_fields = ["bio", "socials", "skills", "projects", "experience", "education"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.utcnow()
    
    # Validate socials if provided
    if "socials" in update_data and update_data["socials"]:
        # Ensure proper structure
        socials = update_data["socials"]
        update_data["socials"] = {
            "linkedin": socials.get("linkedin", ""),
            "github": socials.get("github", ""),
            "twitter": socials.get("twitter", ""),
            "portfolio": socials.get("portfolio", "")
        }
    
    result = await db.members.update_one(
        {"_id": member["_id"]},
        {"$set": update_data}
    )
    
    # Return updated profile
    updated_member = await db.members.find_one({"_id": member["_id"]})
    
    return {
        "message": "Profile updated successfully",
        "profile": MemberPortalProfile(
            id=str(updated_member["_id"]),
            name=updated_member.get("name", ""),
            email=updated_member.get("email"),
            role=updated_member.get("role"),
            roles_by_tenure=updated_member.get("roles_by_tenure"),
            member_type=updated_member.get("member_type", "team"),
            tenure=updated_member.get("tenure"),
            bio=updated_member.get("bio", ""),
            socials=updated_member.get("socials"),
            skills=updated_member.get("skills", []),
            projects=updated_member.get("projects", []),
            experience=updated_member.get("experience", []),
            education=updated_member.get("education", []),
            image_url=updated_member.get("image_url")
        )
    }


@router.post("/member/profile/image")
@limiter.limit("10/minute")
async def update_member_profile_image(request: Request, db=Depends(get_misc_db)):
    """
    Update member's profile image.
    """
    from fastapi import UploadFile, File
    from backend.utils.CloudinaryImageUploader import save_uploaded_image
    
    member = await get_current_member(request, db)
    
    # Parse form data
    form = await request.form()
    image = form.get("image")
    
    if not image:
        raise HTTPException(status_code=400, detail="No image provided")
    
    # Upload image
    try:
        image_url = await save_uploaded_image(image, "team")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image upload failed: {str(e)}")
    
    # Update member
    await db.members.update_one(
        {"_id": member["_id"]},
        {"$set": {"image_url": image_url, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Profile image updated successfully", "image_url": image_url}


# ============== Admin-only endpoints for team communication ==============

async def send_announcement_email(recipient_email: str, member_name: str, subject: str, message: str, include_portal_link: bool = True):
    """Send announcement email to a team member"""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from jinja2 import Template
    from pathlib import Path

    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Load template
    base_path = Path(__file__).parent.parent
    template_path = base_path / "templates" / "team_announcement.html"
    
    try:
        with open(template_path, "r") as f:
            template_str = f.read()
        template = Template(template_str)
        html_content = template.render(
            member_name=member_name,
            subject=subject,
            message=message,
            include_portal_link=include_portal_link,
            portal_url=f"{frontend_url}/member/login",
            year=datetime.utcnow().year
        )
    except Exception as e:
        print(f"Error loading announcement template: {e}")
        html_content = f"""
        <html>
        <body style="font-family: Arial; background: #1e293b; color: white; padding: 20px;">
            <h2>Hello {member_name},</h2>
            <h3>{subject}</h3>
            <p style="white-space: pre-line;">{message}</p>
        </body>
        </html>
        """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"FDC Announcement: {subject}"
    msg["From"] = sender_email
    msg["To"] = recipient_email

    text = f"""
    Taakra 2026 - Team Announcement

    Hello {member_name},

    {subject}

    {message}

    Access Member Portal: {frontend_url}/member/login

    © {datetime.utcnow().year} Taakra 2026. All rights reserved.
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending announcement email to {recipient_email}: {e}")
        return False


async def send_welcome_portal_email(recipient_email: str, member_name: str, temp_password: str = None):
    """Send welcome email to member with portal access info"""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from pathlib import Path

    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    subject = "Welcome to FDC Member Portal - Your Account is Ready!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #0f172a;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
                        <!-- Header -->
                        <tr>
                            <td style="text-align: center; padding-bottom: 30px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.3);">
                                    <h1 style="margin: 0; color: #60a5fa; font-size: 24px; font-weight: bold;">
                                        Taakra 2026
                                    </h1>
                                </div>
                            </td>
                        </tr>

                        <!-- Main Card -->
                        <tr>
                            <td>
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155;">
                                    <tr>
                                        <td style="padding: 30px;">
                                            <div style="text-align: center; margin-bottom: 20px;">
                                                <span style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 10px 20px; border-radius: 25px; color: white; font-size: 14px; font-weight: 600;">
                                                    🎉 Welcome to the Team!
                                                </span>
                                            </div>
                                            
                                            <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 22px; text-align: center;">
                                                Hello {member_name}!
                                            </h2>
                                            
                                            <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 15px; line-height: 1.7;">
                                                Your Taakra 2026 Member Portal account is now ready! You can now access the portal to update your profile, add your skills, projects, and more.
                                            </p>

                                            <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin: 20px 0;">
                                                <h3 style="margin: 0 0 15px; color: #60a5fa; font-size: 16px;">How to Login:</h3>
                                                <ol style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                                                    <li>Go to the Member Portal</li>
                                                    <li>Enter your email: <strong style="color: #60a5fa;">{recipient_email}</strong></li>
                                                    <li>For first login, enter any password - you'll receive an OTP</li>
                                                    <li>Verify the OTP sent to your email</li>
                                                    <li>Set your permanent password</li>
                                                </ol>
                                            </div>

                                            <div style="text-align: center; margin: 25px 0;">
                                                <a href="{frontend_url}/member/login" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                                                    Access Member Portal
                                                </a>
                                            </div>

                                            <p style="margin: 20px 0 0; color: #64748b; font-size: 13px; text-align: center;">
                                                Questions? Contact the club administrators.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding-top: 30px; text-align: center;">
                                <p style="margin: 0; color: #475569; font-size: 12px;">
                                    © {datetime.utcnow().year} Taakra 2026. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = recipient_email

    text = f"""
    Welcome to Taakra 2026 Member Portal!

    Hello {member_name}!

    Your Member Portal account is now ready!

    Login Email: {recipient_email}

    How to Login:
    1. Go to {frontend_url}/member/login
    2. Enter your email
    3. For first login, enter any password - you'll receive an OTP
    4. Verify the OTP and set your password

    Questions? Contact the club administrators.

    © {datetime.utcnow().year} Taakra 2026
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending welcome email to {recipient_email}: {e}")
        return False


@router.post("/admin/team/send-announcement")
@limiter.limit("10/hour")
async def send_team_announcement(request: Request, db=Depends(get_misc_db)):
    """
    Send announcement email to all team members with registered emails.
    Requires admin authentication.
    """
    # Verify admin token
    admin_token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    if not admin_token:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    # Verify admin token by decoding JWT
    try:
        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    
    body = await request.json()
    subject = body.get("subject", "").strip()
    message = body.get("message", "").strip()
    include_portal_link = body.get("include_portal_link", True)
    member_type = body.get("member_type", "all")  # "all", "team", "advisor"
    
    if not subject or not message:
        raise HTTPException(status_code=400, detail="Subject and message are required")
    
    # Get all members with email field, then filter in Python
    query = {"email": {"$exists": True}}
    if member_type == "team":
        query["member_type"] = "team"
    elif member_type == "advisor":
        query["member_type"] = "advisor"
    
    all_members = await db.members.find(query).to_list(length=500)
    
    # Filter in Python to ensure email is valid (not None, not empty string, not just whitespace)
    members = [
        m for m in all_members
        if m.get("email") and isinstance(m.get("email"), str) and m.get("email").strip()
    ]
    
    if not members:
        raise HTTPException(status_code=400, detail="No members found with registered emails")
    
    # Send emails
    sent_count = 0
    failed_emails = []
    
    for member in members:
        email = member.get("email")
        name = member.get("name", "Team Member")
        
        success = await send_announcement_email(email, name, subject, message, include_portal_link)
        if success:
            sent_count += 1
        else:
            failed_emails.append(email)
    
    return {
        "message": f"Announcement sent to {sent_count} members",
        "sent_count": sent_count,
        "total_members": len(members),
        "failed_emails": failed_emails if failed_emails else None
    }


@router.post("/admin/team/notify-portal-access")
@limiter.limit("20/hour")
async def notify_members_portal_access(request: Request, db=Depends(get_misc_db)):
    """
    Send welcome/notification emails to members about their portal access.
    Can target all members or specific ones.
    """
    # Verify admin token
    admin_token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    if not admin_token:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    # Verify admin token by decoding JWT
    try:
        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    
    body = await request.json()
    member_ids = body.get("member_ids")  # Optional list of specific member IDs
    notify_all = body.get("notify_all", False)
    
    # Build query - get members with email field
    query = {"email": {"$exists": True}}
    
    if member_ids and not notify_all:
        query["_id"] = {"$in": [ObjectId(mid) for mid in member_ids]}
    
    all_members = await db.members.find(query).to_list(length=500)
    
    # Filter in Python to ensure email is valid (not None, not empty string, not just whitespace)
    members = [
        m for m in all_members
        if m.get("email") and isinstance(m.get("email"), str) and m.get("email").strip()
    ]
    
    if not members:
        raise HTTPException(status_code=400, detail="No members found with registered emails")
    
    # Send welcome emails
    sent_count = 0
    failed_emails = []
    
    for member in members:
        email = member.get("email")
        name = member.get("name", "Team Member")
        
        success = await send_welcome_portal_email(email, name)
        if success:
            sent_count += 1
            # Mark member as notified
            await db.members.update_one(
                {"_id": member["_id"]},
                {"$set": {"portal_notified": True, "portal_notified_at": datetime.utcnow()}}
            )
        else:
            failed_emails.append(email)
    
    return {
        "message": f"Portal access notification sent to {sent_count} members",
        "sent_count": sent_count,
        "total_members": len(members),
        "failed_emails": failed_emails if failed_emails else None
    }


@router.get("/admin/team/members-with-email")
@limiter.limit("60/minute")
async def get_members_with_email(request: Request, db=Depends(get_misc_db)):
    """
    Get all members that have registered emails (for admin use).
    """
    # Verify admin token
    admin_token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    if not admin_token:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    # Verify admin token by decoding JWT
    try:
        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    
    # Query for members with email field
    all_members = await db.members.find(
        {"email": {"$exists": True}},
        {"_id": 1, "name": 1, "email": 1, "member_type": 1, "role": 1, "portal_notified": 1}
    ).to_list(length=500)
    
    # Filter in Python to ensure email is valid (not None, not empty string, not just whitespace)
    members = [
        m for m in all_members
        if m.get("email") and isinstance(m.get("email"), str) and m.get("email").strip()
    ]
    
    return {
        "members": [
            {
                "id": str(m["_id"]),
                "name": m.get("name", ""),
                "email": m.get("email", "").strip(),
                "member_type": m.get("member_type", "team"),
                "role": m.get("role", ""),
                "portal_notified": m.get("portal_notified", False)
            }
            for m in members
        ],
        "total": len(members)
    }
