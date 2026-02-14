from pydantic import BaseModel, HttpUrl, Field, EmailStr
from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime

class MemberType(str, Enum):
    TEAM = "team"
    ADVISOR = "advisor"

class SocialLinks(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    portfolio: Optional[str] = None


# Member Portal Authentication Schemas
class MemberLoginRequest(BaseModel):
    email: EmailStr


class MemberOTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: int


class MemberPasswordSetRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class MemberPasswordResetRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class MemberForgotPasswordRequest(BaseModel):
    email: EmailStr


class Project(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None


class ExperienceItem(BaseModel):
    role: str
    company: str
    period: Optional[str] = None
    description: Optional[str] = None


class EducationItem(BaseModel):
    degree: str
    institution: str
    period: Optional[str] = None

class TeamMemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: Optional[str] = Field(None, max_length=100)  # Deprecated: kept for backward compatibility
    roles_by_tenure: Optional[Dict[str, str]] = None  # e.g., {"2024-2025": "President", "2025-2026": "Vice President"}
    member_type: MemberType
    tenure: Optional[list[str]] = None  # e.g., ["2024-2025", "2025-2026"] - supports multiple tenures
    bio: Optional[str] = ""
    socials: Optional[SocialLinks] = None
    skills: Optional[list] = None
    projects: Optional[list[Project]] = None
    experience: Optional[list[ExperienceItem]] = None
    education: Optional[list[EducationItem]] = None
    email: Optional[str] = None  # Email for member portal login

    class Config:
        use_enum_values = True

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberUpdate(TeamMemberBase):
    pass

class TeamMemberInDB(TeamMemberBase):
    id: str
    image_url: Optional[str] = None
    order_by_tenure: Optional[Dict[str, int]] = None  # e.g., {"2024-2025": 0, "2025-2026": 1}
    has_portal_access: Optional[bool] = False  # Whether member can login to portal
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True


# Response model for member portal (excludes sensitive data)
class MemberPortalProfile(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    role: Optional[str] = None
    roles_by_tenure: Optional[Dict[str, str]] = None
    member_type: str
    tenure: Optional[list[str]] = None
    bio: Optional[str] = ""
    socials: Optional[SocialLinks] = None
    skills: Optional[list] = None
    projects: Optional[list[Project]] = None
    experience: Optional[list[ExperienceItem]] = None
    education: Optional[list[EducationItem]] = None
    image_url: Optional[str] = None


class MemberPortalUpdateRequest(BaseModel):
    bio: Optional[str] = None
    socials: Optional[SocialLinks] = None
    skills: Optional[list] = None
    projects: Optional[list[Project]] = None
    experience: Optional[list[ExperienceItem]] = None
    education: Optional[list[EducationItem]] = None