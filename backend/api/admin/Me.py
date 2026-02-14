"""Current admin user info and permissions for conditional dashboard."""
from fastapi import APIRouter, HTTPException, Depends, Request
from backend.config.database.init import get_misc_db
from backend.middleware.auth.token import verify_token
from jose import jwt
import os

router = APIRouter(tags=["admin-me"])

# All permission keys that map to admin panel sections (must match frontend)
ALL_PERMISSIONS = [
    "dashboard",
    "home",
    "about",
    "contact",
    "events",
    "categories",
    "support_members",
    "team",
    "hall_of_fame",
    "blogs",
    "faq",
    "jobs",
    "registrations",
    "messages",
    "delegations",
    "settings",
]


def _get_identifier_from_token(request: Request) -> str:
    """Extract email/username from adminAuthToken."""
    token = request.headers.get("adminAuthToken") or request.cookies.get("adminAuthToken")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=[os.getenv("JWT_ALGORITHM", "HS256")],
        )
        return payload.get("email") or payload.get("username") or ""
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/me")
async def get_me(
    request: Request,
    db=Depends(get_misc_db),
    auth=Depends(verify_token),
):
    """
    Return current admin user info and permissions.
    Full admin (no role or role != 'support') gets all permissions.
    Support members get only their assigned permissions list.
    """
    identifier = _get_identifier_from_token(request)
    if not identifier:
        raise HTTPException(status_code=401, detail="Could not identify user")

    admin_doc = await db["admin"].find_one({"$or": [{"email": identifier}, {"username": identifier}]})
    if not admin_doc:
        raise HTTPException(status_code=404, detail="Admin not found")

    role = admin_doc.get("role", "")
    is_full_admin = role != "support"

    if is_full_admin:
        permissions = list(ALL_PERMISSIONS)
    else:
        permissions = admin_doc.get("permissions") or []
        # Ensure only allowed keys
        permissions = [p for p in permissions if p in ALL_PERMISSIONS]

    return {
        "email": admin_doc.get("email", ""),
        "username": admin_doc.get("username", ""),
        "name": admin_doc.get("name", ""),
        "role": role or "admin",
        "is_full_admin": is_full_admin,
        "permissions": permissions,
        "all_permissions": ALL_PERMISSIONS,
    }
