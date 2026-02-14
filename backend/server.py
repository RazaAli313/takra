import sys
import os

# Get the backend directory (where this file is)
backend_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (FDC-Website) which contains the 'backend' package
parent_dir = os.path.dirname(backend_dir)

# Add parent directory to path so 'backend' module can be found
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Also add backend directory to path for relative imports
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
from fastapi import FastAPI, HTTPException, Request,Response,UploadFile, File, Form, status, APIRouter
from datetime import datetime, timedelta
from email.mime.text import MIMEText
import smtplib
from email.mime.multipart import MIMEMultipart
import random
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from backend.config.database.init import init_db
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import smtplib
from jinja2 import Template
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from backend.middleware.auth.otp import router as otp_router
from backend.middleware.auth.token import router as token_router
from backend.api.Team import router as team_router
from backend.api.Registrations import router as registrations_router
from backend.api.Content import router as content_router
from backend.api.Banner import router as banner_router
from backend.api.FAQ import router as faq_router
from backend.api.Job import router as job_router
from backend.api.Event import router as event_router
from backend.api.Competition import router as competition_router
from backend.api.Category import router as category_router
from backend.api.Blog import router as blog_router
from backend.api.About import router as about_router
from backend.api.Contact import router as contact_router
from backend.api.HallofFame import router as halloffame_router
from backend.api.Subscribe import router as subscribe_router
from backend.api.admin.Settings import router as settings_router
from backend.api.Positions import router as positions_router
from backend.api.Delegation import router as delegation_router
from pathlib import Path
import time
import httpx
# from backend.api import Subscribe
import uuid
# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from apscheduler.triggers.interval import IntervalTrigger
from PIL import Image, UnidentifiedImageError

from fastapi.staticfiles import StaticFiles

import logging

from enum import Enum
import motor.motor_asyncio
from pymongo import ReturnDocument
import cloudinary

from dotenv import load_dotenv
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
from backend.config.limiter import _limiter as limiter

# Global limiter setup


load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Keep-alive scheduler to prevent Azure free tier from sleeping
# scheduler = AsyncIOScheduler()
# KEEP_ALIVE_URL = "https://fdc-pucit.org"  # Your website URL
# KEEP_ALIVE_INTERVAL_MINUTES = 5  # Ping every 5 minutes

# async def ping_website():
#     """Ping the website to keep Azure free tier server awake"""
#     try:
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             response = await client.get(KEEP_ALIVE_URL)
#             logger.info(f"✅ Keep-alive ping successful: {KEEP_ALIVE_URL} - Status: {response.status_code}")
#     except Exception as e:
#         logger.warning(f"⚠️ Keep-alive ping failed: {str(e)}")



# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fdc-pucit.org","https://www.fdc-pucit.org", "http://localhost:5173", "https://fdc-pucit.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)




# Global rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please slow down."},
    )
@app.exception_handler(HTTPException)
async def http_exception_logger(request: Request, exc: HTTPException):
    """Log HTTPException details (status code and detail) for easier debugging.
    This preserves the original response but ensures the server logs the exception
    and request path so we can trace 400/401/422 responses.
    """
    logging.getLogger(__name__).exception(f"HTTPException at {request.url.path} status={exc.status_code} detail={exc.detail}")
    # Mirror default FastAPI behavior by returning a JSONResponse with the same detail
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
@app.get("/")
def root():
    return {"message": "Backend running!"}


# Temporary unauthenticated debug CSV endpoint (bypass router-level auth)
@app.get('/api/admin/delegations/export-debug-2')
async def export_delegations_debug2():
    import io, csv
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['id', 'name', 'email'])
        writer.writerow(['debug-2', 'Debug User 2', 'debug2@example.com'])
        return Response(content=output.getvalue(), media_type='text/csv')
    except Exception:
        logging.getLogger(__name__).exception('Failed to generate server-level debug CSV')
        raise HTTPException(status_code=500, detail='Failed to generate debug CSV')

GOOGLE_RECAPTCHA_SECRET = os.getenv("GOOGLE_RECAPTCHA_SECRET")

class CaptchaRequest(BaseModel):
    token: str

GOOGLE_SECRET_KEY = os.getenv("GOOGLE_SECRET_KEY")

@app.post("/verify_captcha")
async def verify_captcha(request: Request, response: Response):
    data = await request.json()
    token = data.get("token")

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": GOOGLE_SECRET_KEY, "response": token}
        )

    result = res.json()

    if result.get("success") and result.get("score", 0) > 0.5:
        # Generate a short-lived verification cookie (e.g. 5 minutes)
        expires = int(time.time()) + 300
        response.set_cookie(
            key="human_verified",
            value="true",
            httponly=True,
            secure=True,       # HTTPS only
            samesite="Strict", # Prevent CSRF
            max_age=300        # 5 minutes
        )
        return {"success": True, "score": result["score"], "expires": expires}

    logger.warning(f"reCAPTCHA verification failed: {result}")
    return {"success": False, "error": result}



@app.post("/submit_form")
async def submit_form(request: Request):
    human_verified = request.cookies.get("human_verified")
    if human_verified != "true":
        raise HTTPException(status_code=403, detail="reCAPTCHA not verified")
    # Continue with your logic
    return {"success": True, "message": "Welcome, verified human 👋"}

app.include_router(otp_router, prefix="/api")
# app.include_router(Subscribe.router, prefix="/api")
app.include_router(token_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(banner_router, prefix="/api")
app.include_router(faq_router, prefix="/api")
app.include_router(job_router, prefix="/api")
app.include_router(team_router, prefix="/api")
app.include_router(registrations_router, prefix="/api")
app.include_router(event_router, prefix="/api")
app.include_router(competition_router, prefix="/api")
app.include_router(category_router, prefix="/api")
app.include_router(blog_router, prefix="/api")
app.include_router(about_router, prefix="/api")
app.include_router(contact_router, prefix="/api")
app.include_router(halloffame_router, prefix="/api")
app.include_router(subscribe_router, prefix="/api")
app.include_router(settings_router, prefix="/api/admin")
app.include_router(positions_router, prefix="/api")
app.include_router(delegation_router, prefix="/api")
from backend.api.admin.Metrics import router as metrics_router
from backend.api.admin.SupportMembers import router as support_members_router
app.include_router(metrics_router, prefix="/api/admin")
app.include_router(support_members_router, prefix="/api/admin")
from backend.api.admin.Delegations import router as delegations_admin_router
app.include_router(delegations_admin_router, prefix="/api/admin")
from backend.api.CogentLabsRegistration import router as cogent_labs_registration_router
app.include_router(cogent_labs_registration_router, prefix="/api")
from backend.api.CogentLabsAuth import router as cogent_labs_auth_router
app.include_router(cogent_labs_auth_router, prefix="/api")
from backend.api.BlogAdminAuth import router as blog_admin_auth_router
app.include_router(blog_admin_auth_router, prefix="/api")
from backend.api.MemberAuth import router as member_auth_router
app.include_router(member_auth_router, prefix="/api")
from backend.api.admin.CogentLabsRegistrations import router as cogent_labs_registrations_admin_router
app.include_router(cogent_labs_registrations_admin_router, prefix="/api/admin")
from backend.api.admin.BlogComments import router as blog_comments_admin_router
app.include_router(blog_comments_admin_router, prefix="/api/admin")
@app.on_event("startup")
async def startup_db_client():
    await init_db()
    
    # Start the keep-alive scheduler
    # scheduler.add_job(
    #     ping_website,
    #     trigger=IntervalTrigger(minutes=KEEP_ALIVE_INTERVAL_MINUTES),
    #     id="keep_alive_ping",
    #     name="Keep-alive ping to prevent server sleep",
    #     replace_existing=True
    # )
    # scheduler.start()
    # logger.info(f"🚀 Keep-alive scheduler started - pinging {KEEP_ALIVE_URL} every {KEEP_ALIVE_INTERVAL_MINUTES} minutes")

@app.on_event("shutdown")
async def shutdown_db_client():
    # Shutdown the scheduler
    # if scheduler.running:
        # scheduler.shutdown()
        # logger.info("🛑 Keep-alive scheduler stopped")
    # Close connections if needed
    print("🛑 Shutting down DB clients")
import uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
    print(f"Server started at {datetime()}")