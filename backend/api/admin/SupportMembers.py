"""Taakra - Admin-only API to add support members (as admins) with invitation email."""
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader

from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi import status
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

from backend.config.database.init import get_misc_db
from backend.middleware.auth.token import verify_token, pwd_context
from backend.api.admin.Me import ALL_PERMISSIONS

router = APIRouter(prefix="/support-members", tags=["admin-support-members"])

# Role value stored in admin collection for support members
SUPPORT_ROLE = "support"


def _parse_permissions(permissions_str: Optional[str]) -> List[str]:
    """Parse comma-separated permissions and return only allowed keys."""
    if not permissions_str or not permissions_str.strip():
        return []
    parts = [p.strip() for p in permissions_str.split(",") if p.strip()]
    return [p for p in parts if p in ALL_PERMISSIONS]


def _send_invitation_email(to_email: str, name: str, email: str, password: str, login_url: str) -> None:
    """Send invitation email with login credentials."""
    template_dir = os.path.join(os.path.dirname(__file__), "../../templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("support_member_invitation.html")
    year = datetime.utcnow().year
    html = template.render(
        name=name,
        email=email,
        password=password,
        login_url=login_url,
        year=year,
    )
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("ADMIN_EMAIL", "contact@taakra2026.com")
    smtp_password = os.getenv("ADMIN_EMAIL_PASSWORD", "")
    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = "Taakra 2026 – Admin Portal Invitation"
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            if smtp_password:
                server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    except Exception as e:
        # Log but don't fail the request; admin can resend or share credentials manually
        import logging
        logging.getLogger(__name__).exception("Failed to send support member invitation email: %s", e)


def support_member_helper(doc) -> dict:
    """Build response dict; never include password."""
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "role": doc.get("role", SUPPORT_ROLE),
        "permissions": doc.get("permissions") or [],
        "created_at": doc.get("created_at"),
    }


@router.get("", response_model=List[dict])
async def list_support_members(
    db=Depends(get_misc_db),
    auth=Depends(verify_token),
):
    """List all support members (admins with role support)."""
    members = []
    async for m in db["admin"].find({"role": SUPPORT_ROLE}).sort("created_at", -1):
        members.append(support_member_helper(m))
    return members


@router.get("/permissions")
async def list_permissions(auth=Depends(verify_token)):
    """Return all available permission keys for support member assignment."""
    return {"permissions": ALL_PERMISSIONS}


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_support_member(
    name: str = Form(...),
    email: str = Form(...),
    role: Optional[str] = Form(SUPPORT_ROLE),
    permissions: Optional[str] = Form(None, description="Comma-separated: events,categories,registrations,..."),
    login_base_url: Optional[str] = Form(None, description="Base URL for admin login link, e.g. https://yoursite.com"),
    db=Depends(get_misc_db),
    auth=Depends(verify_token),
):
    """
    Add a support member as admin with selected permissions. Generates a random password,
    stores in admin collection, and sends an invitation email.
    Support member can log in and only see/access the admin sections they have permission for.
    """
    email = (email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Check both admin and support member (admin collection)
    existing = await db["admin"].find_one({"$or": [{"email": email}, {"username": email}]})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An admin or support member with this email already exists",
        )

    # Generate a one-time password (e.g. 12 character alphanumeric)
    plain_password = secrets.token_urlsafe(12)[:16]  # readable length
    hashed_password = pwd_context.hash(plain_password)

    perm_list = _parse_permissions(permissions)
    now = datetime.utcnow()
    doc = {
        "name": (name or "").strip(),
        "email": email,
        "username": email,
        "password": hashed_password,
        "role": (role or SUPPORT_ROLE).strip() or SUPPORT_ROLE,
        "permissions": perm_list,
        "created_at": now,
    }

    result = await db["admin"].insert_one(doc)
    created = await db["admin"].find_one({"_id": result.inserted_id})
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create support member")

    # Login URL: use env or form param, fallback to relative path
    base = (login_base_url or os.getenv("FRONTEND_BASE_URL", "")).rstrip("/")
    login_url = f"{base}/admin/login" if base else "/admin/login"

    _send_invitation_email(
        to_email=email,
        name=created.get("name", ""),
        email=email,
        password=plain_password,
        login_url=login_url,
    )

    return support_member_helper(created)


@router.put("/{member_id}")
async def update_support_member(
    member_id: str,
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    permissions: Optional[str] = Form(None, description="Comma-separated permission keys"),
    db=Depends(get_misc_db),
    auth=Depends(verify_token),
):
    """Update a support member's name, email, or permissions. Only for role=support."""
    if not ObjectId.is_valid(member_id):
        raise HTTPException(status_code=400, detail="Invalid member ID")
    doc = await db["admin"].find_one({"_id": ObjectId(member_id), "role": SUPPORT_ROLE})
    if not doc:
        raise HTTPException(status_code=404, detail="Support member not found")

    update = {}
    if name is not None:
        update["name"] = name.strip()
    if email is not None:
        new_email = email.strip().lower()
        if new_email:
            existing = await db["admin"].find_one({"$or": [{"email": new_email}, {"username": new_email}], "_id": {"$ne": ObjectId(member_id)}})
            if existing:
                raise HTTPException(status_code=400, detail="Another admin/support member already has this email")
            update["email"] = new_email
            update["username"] = new_email
    if permissions is not None:
        update["permissions"] = _parse_permissions(permissions)
    update["updated_at"] = datetime.utcnow()

    if not update:
        return support_member_helper(doc)
    await db["admin"].update_one({"_id": ObjectId(member_id)}, {"$set": update})
    updated = await db["admin"].find_one({"_id": ObjectId(member_id)})
    return support_member_helper(updated)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_support_member(
    member_id: str,
    db=Depends(get_misc_db),
    auth=Depends(verify_token),
):
    """Remove a support member (delete from admin collection). Only removes docs with role=support."""
    if not ObjectId.is_valid(member_id):
        raise HTTPException(status_code=400, detail="Invalid member ID")
    res = await db["admin"].delete_one(
        {"_id": ObjectId(member_id), "role": SUPPORT_ROLE}
    )
    if res.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Support member not found or cannot be deleted",
        )
    return None
