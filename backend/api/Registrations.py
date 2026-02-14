from fastapi import APIRouter, HTTPException, Depends, Request, Response, Form, File, UploadFile, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from datetime import datetime, timedelta
import backend.config.database.init as config
from backend.config.database.init import get_misc_db
# from backend.config.limiter import _limiter as limiter
# from bson import ObjectId
import csv
import io
import os
from backend.utils.CloudinaryImageUploader import save_uploaded_image
import json
import httpx
import os
import random
import aiosmtplib
from email.message import EmailMessage

# optional google sheets sync
from backend.utils import google_sheets
import re
from backend.middleware.auth.token import verify_token

router = APIRouter()
db = config.miscDB


class RegistrationCreate(BaseModel):
    name: str = Field(...)
    roll_no: Optional[str] = None
    campus: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    picture_url: Optional[str] = None
    portfolio: Optional[str] = None
    linkedin: Optional[str] = None
    why_join: Optional[str] = None
    experience_alignment: Optional[str] = None
    other_society: Optional[str] = None
    expertise: Optional[str] = None
    best_thing: Optional[str] = None
    improve: Optional[str] = None
    position_applied: Optional[str] = None


class RegistrationInDB(RegistrationCreate):
    id: str
    created_at: datetime


@router.post('/registrations/', status_code=201)
# @limiter.limit("10/day")
async def create_registration( request: Request,
    name: str = Form(...),
    roll_no: str = Form(...),
    campus: str = Form(...),
    email: EmailStr = Form(...),
    phone: str = Form(...),
    picture: Optional[UploadFile] = File(None),
    portfolio: Optional[str] = Form(None),
    linkedin: str = Form(...),
    why_join: str = Form(...),
    experience_alignment: str = Form(...),
    other_society: str = Form(...),
    expertise: str = Form(...),
    best_thing: str = Form(...),
    improve: str = Form(...),
    position_applied: str = Form(...),
    google_token: Optional[str] = Form(None),
    db=Depends(get_misc_db)
):
    data = {
        'name': name,
        'roll_no': roll_no,
        'campus': campus,
        'email': str(email),
        'phone': phone,
        'portfolio': portfolio,
        'linkedin': linkedin,
        'why_join': why_join,
        'experience_alignment': experience_alignment,
        'other_society': other_society,
        'expertise': expertise,
        'best_thing': best_thing,
        'improve': improve,
        'position_applied': position_applied,
    }
    # If a Google ID token was provided, verify it with Google's tokeninfo endpoint
    if google_token:
        try:
            async with httpx.AsyncClient() as client:
                # tokeninfo endpoint accepts id_token as query
                r = await client.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': google_token}, timeout=10.0)
            if r.status_code != 200:
                raise Exception('Invalid Google token')
            info = r.json()
            # optional audience check if env provided
            expected_aud = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
            if expected_aud and info.get('aud') != expected_aud:
                raise Exception('Token audience mismatch')
            # require email verified
            if info.get('email_verified') not in (True, 'true', '1'):
                raise Exception('Google email not verified')
            # Use verified email and name from token to populate data (override submitted values)
            data['email'] = info.get('email') or data['email']
            if info.get('name'):
                data['name'] = info.get('name')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Google sign-in verification failed: {str(e)}')
    # handle picture upload via helper (optional)
    picture_url = None
    if picture:
        try:
            # use the project's Cloudinary helper which validates and uploads
            picture_url = await save_uploaded_image(picture)
        except Exception as e:
            # log and continue; admin will see empty picture_url
            print('Picture upload failed via helper:', str(e))
    data['picture_url'] = picture_url
    # Prevent duplicate registrations for the same email
    existing = await db.registrations.find_one({'email': str(email)})
    if existing:
        raise HTTPException(status_code=400, detail='An application with this email already exists')

    # Require email verification: there must be a verified code for this email
    vdoc = await db.registration_verifications.find_one({'email': str(email), 'verified': True, 'used': {'$ne': True}, 'expires_at': {'$gte': datetime.utcnow()}})
    if not vdoc:
        raise HTTPException(status_code=403, detail='Email not verified. Please verify your email before submitting the application.')
    # Check registrations open flag
    s = await db.settings.find_one({'_id': 'registrations'})
    if s and not s.get('open', True):
        raise HTTPException(status_code=403, detail='Registrations are currently closed')

    # Server-side validation: if there are configured positions, require the submitted position to exist
    try:
        positions_count = await db.positions.count_documents({})
    except Exception:
        positions_count = 0

    if positions_count > 0:
        pos_doc = await db.positions.find_one({'name': position_applied})
        if not pos_doc:
            # build list of available names for a better error message
            avail = []
            async for p in db.positions.find({}).sort('created_at', -1):
                avail.append(p.get('name'))
            raise HTTPException(status_code=400, detail=f'Invalid position_applied. Available positions: {", ".join(avail)}')

    data['created_at'] = datetime.utcnow()
    res = await db.registrations.insert_one(data)
    # mark verification as used
    try:
        await db.registration_verifications.update_one({'_id': vdoc['_id']}, {'$set': {'used': True, 'used_at': datetime.utcnow()}})
    except Exception:
        pass
    rec = await db.registrations.find_one({'_id': res.inserted_id})
    rec['id'] = str(rec['_id'])
    return RegistrationInDB(**rec)



@router.post('/registrations/request_verification')
# @limiter.limit("15/hour")
async def request_registration_verification( request: Request,payload: dict = Body(...), db=Depends(get_misc_db)):
    email = payload.get('email')
    if not email:
        raise HTTPException(status_code=400, detail='Email is required')
    # check if already registered
    if await db.registrations.count_documents({'email': email}) > 0:
        raise HTTPException(status_code=400, detail='This email has already been used for an application')

    # generate 6-digit code
    code = f"{random.randint(0, 999999):06d}"
    now = datetime.utcnow()
    expires = now + timedelta(hours=24)
    doc = {
        'email': email,
        'code': code,
        'verified': False,
        'used': False,
        'created_at': now,
        'expires_at': expires,
        'attempts': 0
    }
    await db.registration_verifications.insert_one(doc)

    # send email with code
    try:
        ADMIN_EMAIL = os.getenv('ADMIN_EMAIL') or 'fcit-developers.club@pucit.edu.pk'
        ADMIN_EMAIL_PASSWORD = os.getenv('ADMIN_EMAIL_PASSWORD') or os.getenv('ADMIN_EMAIL_PASSWORD') or ''
        SMTP_SERVER = os.getenv('SMTP_SERVER') or 'smtp.gmail.com'
        SMTP_PORT = int(os.getenv('SMTP_PORT') or 587)
        msg = EmailMessage()
        msg['From'] = ADMIN_EMAIL
        msg['To'] = email
        msg['Subject'] = 'Your verification code for FCIT Developers Club Application'
        # Try to use HTML template if available in backend/templates
        try:
            tpl_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'team_registration_template.html')
            tpl_path = os.path.abspath(tpl_path)
            with open(tpl_path, 'r', encoding='utf-8') as f:
                html_tpl = f.read()
            timestamp = datetime.utcnow().isoformat()
            ip_addr = 'unknown'
            try:
                if request and getattr(request, 'client', None):
                    ip_addr = request.client.host or 'otpunknown'
            except Exception:
                ip_addr = 'unknown'
            html = html_tpl.replace('{{otp}}', code).replace('{{timestamp}}', timestamp).replace('{{ip_address}}', ip_addr).replace('{{year}}', str(datetime.utcnow().year)).replace('{{device_info}}', '')
            msg.set_content(f'Your verification code is: {code}\nThis code will expire in 24 hours.')
            msg.add_alternative(html, subtype='html')
        except Exception as e:
            # if template read fails, fall back to plain text
            print('Failed to load HTML template for OTP email:', e)
            msg.set_content(f'Your verification code is: {code}\nThis code will expire in 24 hours.')

        await aiosmtplib.send(msg, hostname=SMTP_SERVER, port=SMTP_PORT, start_tls=True, username=ADMIN_EMAIL, password=ADMIN_EMAIL_PASSWORD)
    except Exception as e:
        # log and continue; verification still stored
        print('Failed to send verification email:', e)

    return {'sent': True}


@router.post('/registrations/verify_code')
# @limiter.limit("15/hour")
async def verify_registration_code( request: Request,payload: dict = Body(...), db=Depends(get_misc_db)):
    email = payload.get('email')
    code = payload.get('code')
    if not email or not code:
        raise HTTPException(status_code=400, detail='email and code required')
    now = datetime.utcnow()
    # find the most recent unexpired verification for this email (handles multiple requests)
    v = None
    try:
        cursor = db.registration_verifications.find({'email': email, 'expires_at': {'$gte': now}}).sort('created_at', -1).limit(1)
        lst = await cursor.to_list(length=1)
        if lst:
            v = lst[0]
    except Exception:
        # fallback to simple find_one if sorted query fails in this environment
        v = await db.registration_verifications.find_one({'email': email, 'expires_at': {'$gte': now}})
    if not v:
        raise HTTPException(status_code=400, detail='No verification request found or code expired')
    if v.get('used'):
        raise HTTPException(status_code=400, detail='Verification code already used')
    # increment attempts
    await db.registration_verifications.update_one({'_id': v['_id']}, {'$inc': {'attempts': 1}})
    # compare codes (strings) — strip whitespace from supplied code
    supplied = str(code).strip()
    stored = str(v.get('code')) if v.get('code') is not None else ''
    if stored != supplied:
        # log mismatch for debugging (do not expose actual code in response)
        print(f"Verification failed for email={email}: supplied='{supplied}', stored_len={len(stored)}")
        raise HTTPException(status_code=400, detail='Invalid verification code')
    # mark verified
    await db.registration_verifications.update_one({'_id': v['_id']}, {'$set': {'verified': True, 'verified_at': now}})
    return {'verified': True}


@router.get('/registrations/status')
# @limiter.limit("20/day")
async def get_registrations_status( request: Request,db=Depends(get_misc_db)):
    # Read status from settings document (default open=true)
    s = await db.settings.find_one({'_id': 'registrations'})
    if not s:
        return {'open': True}
    return {'open': bool(s.get('open', True))}


@router.get('/registrations/', response_model=List[RegistrationInDB])
# @limiter.limit("20/day")
async def list_registrations( request: Request,db=Depends(get_misc_db), auth=Depends(verify_token)):
    items = []
    async for r in db.registrations.find().sort('created_at', -1):
        r['id'] = str(r['_id'])
        items.append(RegistrationInDB(**r))
    return items


@router.get('/registrations/export')
async def export_registrations_csv(db=Depends(get_misc_db), auth=Depends(verify_token)):
    # Export registrations as CSV
    cursor = db.registrations.find().sort('created_at', -1)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id', 'name', 'roll_no', 'campus', 'email', 'phone', 'position_applied', 'portfolio', 'linkedin', 'picture_url', 'experience_alignment', 'other_society', 'why_join', 'expertise', 'best_thing', 'improve', 'created_at'])
    async for r in cursor:
        writer.writerow([
            str(r.get('_id')),
            r.get('name', ''),
            r.get('roll_no', ''),
            r.get('campus', ''),
            r.get('email', ''),
            r.get('phone', ''),
            r.get('position_applied', ''),
            r.get('portfolio', ''),
            r.get('linkedin', ''),
            r.get('picture_url', ''),
            r.get('experience_alignment', ''),
            r.get('other_society', ''),
            r.get('why_join', ''),
            r.get('expertise', ''),
            r.get('best_thing', ''),
            r.get('improve', ''),
            r.get('created_at').isoformat() if r.get('created_at') else ''
        ])
    return Response(content=output.getvalue(), media_type='text/csv')


class SheetsSyncRequest(BaseModel):
    spreadsheet_url: Optional[str] = None
    spreadsheet_id: Optional[str] = None


async def _extract_spreadsheet_id(url_or_id: Optional[str]) -> Optional[str]:
    if not url_or_id:
        return None
    # if it already looks like an id (no slashes), return it
    if '/' not in url_or_id and '\\' not in url_or_id:
        return url_or_id.strip()
    # try to extract from common Google Sheets URL formats
    m = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url_or_id)
    if m:
        return m.group(1)
    # fallback: try last path segment
    try:
        parts = url_or_id.rstrip('/').split('/')
        if parts:
            return parts[-1]
    except Exception:
        return None
    return None


# @router.post('/registrations/sync')
# async def sync_registrations(payload: Optional[SheetsSyncRequest] = Body(None), db=Depends(get_misc_db), auth=Depends(verify_token)):
#     """Sync registrations to a Google Sheet configured via env vars.

#     Required env:
#       - GOOGLE_SERVICE_ACCOUNT_FILE (path) OR GOOGLE_SERVICE_ACCOUNT_INFO (json string)
#       - GOOGLE_SHEETS_SPREADSHEET_ID (optional - used if no url/id provided in request)

#     Note: This endpoint is intended for admin use. Add auth if required.
#     """
#     sheet_range = os.getenv('GOOGLE_SHEETS_RANGE', 'Sheet1!A:Z')

#     # Determine spreadsheet id: prefer payload.spreadsheet_id/spreadsheet_url, else env or saved admin setting
#     spreadsheet_id = None
#     if payload:
#         if getattr(payload, 'spreadsheet_id', None):
#             spreadsheet_id = payload.spreadsheet_id
#         elif getattr(payload, 'spreadsheet_url', None):
#             spreadsheet_id = await _extract_spreadsheet_id(payload.spreadsheet_url)

#     if not spreadsheet_id:
#         # fallback to env var for backward compatibility
#         spreadsheet_id = os.getenv('GOOGLE_SHEETS_SPREADSHEET_ID')

#     if not spreadsheet_id:
#         # fallback to saved admin setting in DB (document _id: 'registrations_spreadsheet')
#         sdoc = await db.settings.find_one({'_id': 'registrations_spreadsheet'})
#         if sdoc and sdoc.get('spreadsheet_id'):
#             spreadsheet_id = sdoc.get('spreadsheet_id')

#     if not spreadsheet_id:
#         raise HTTPException(status_code=400, detail='Spreadsheet URL or ID must be provided in request body or configured in GOOGLE_SHEETS_SPREADSHEET_ID')

#     # load registrations
#     regs = []
#     async for r in db.registrations.find().sort('created_at', -1):
#         regs.append(r)

#     try:
#         # Protect sync to admin-only
#         # verify_token dependency is applied at route (see above)
#         result = google_sheets.sync_registrations_to_sheet(regs, spreadsheet_id, sheet_range)
#         return {'status': 'ok', 'result': result}
#     except Exception as e:
#         err_text = str(e)
#         print('Sheets sync failed:', err_text)
#         # Provide clearer guidance when google auth/client packages are missing
#         if 'google-auth or google-api-python-client not installed' in err_text or ('google-auth' in err_text and 'google-api-python-client' in err_text):
#             raise HTTPException(status_code=500, detail='Google Sheets client libraries are not installed in the Python environment. Install them with: pip install google-auth google-api-python-client')
#         # otherwise forward the original error message
#         raise HTTPException(status_code=500, detail='Google Sheets sync failed: ' + err_text)
