from fastapi import APIRouter, HTTPException, Depends, Response, Request, Body
from fastapi.responses import StreamingResponse, Response
from backend.config.database.init import get_misc_db
from backend.api.CogentLabsAuth import verify_cogentlabs_token
from typing import List
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime
import io, csv
import httpx
import logging
import cloudinary.uploader
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from jinja2 import Template

router = APIRouter()

class RegistrationStatus(BaseModel):
    open: bool


@router.get('/registrations/export')
async def export_registrations_csv(request: Request, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    try:
        logger = logging.getLogger(__name__)
        try:
            hdr_token = request.headers.get('adminAuthToken') or request.cookies.get('adminAuthToken')
            logger.info(f"Export requested from {request.client.host} hdr_admin_token_present={bool(hdr_token)} cookies_present={len(request.cookies)>0}")
        except Exception:
            logger.exception('Failed to log request auth info')
        # Build CSV in-memory
        cursor = db.cogent_labs_registrations.find().sort('created_at', -1)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['id', 'name', 'cnic', 'email', 'phone', 'batch', 'campus', 'why_join', 'comments', 'resume_filename', 'resume_url', 'feedback', 'created_at'])
        async for r in cursor:
            # Format CNIC and phone as text to prevent Excel scientific notation
            # Prefix with apostrophe to force Excel to treat as text (apostrophe is not displayed)
            cnic = r.get('cnic', '')
            phone = r.get('phone', '')
            # Add apostrophe prefix to force Excel to treat as text
            cnic_text = f"'{cnic}" if cnic else ''
            phone_text = f"'{phone}" if phone else ''
            
            writer.writerow([
                str(r.get('_id')),
                r.get('name', ''),
                cnic_text,
                r.get('email', ''),
                phone_text,
                r.get('batch', ''),
                r.get('campus', ''),
                r.get('why_join', ''),
                r.get('comments', ''),
                r.get('resume_filename', ''),
                r.get('resume_url', ''),
                r.get('feedback', ''),
                r.get('created_at').isoformat() if r.get('created_at') else ''
            ])
        logging.getLogger(__name__).info('Admin CSV export requested')
        return Response(content=output.getvalue(), media_type='text/csv')
    except Exception:
        logging.exception('Failed to generate registrations CSV')
        raise HTTPException(status_code=500, detail='Failed to generate CSV')


@router.get('/registrations')
async def list_registrations(db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    items = []
    async for d in db.cogent_labs_registrations.find().sort('created_at', -1):
        items.append({
            'id': str(d.get('_id')),
            'name': d.get('name'),
            'email': d.get('email'),
            'phone': d.get('phone'),
            'batch': d.get('batch'),
            'campus': d.get('campus'),
            'created_at': d.get('created_at').isoformat() if d.get('created_at') else None,
            'feedback': d.get('feedback', '')
        })
    return items


@router.get('/registrations/{item_id}')
async def get_registration(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    d = await db.cogent_labs_registrations.find_one({'_id': oid})
    if not d:
        raise HTTPException(status_code=404, detail='Not found')
    # Build a JSON-serializable representation (convert ObjectId and datetimes)
    out = {
        'id': str(d.get('_id')),
        'name': d.get('name'),
        'cnic': d.get('cnic'),
        'email': d.get('email'),
        'phone': d.get('phone'),
        'batch': d.get('batch'),
        'campus': d.get('campus'),
        'why_join': d.get('why_join'),
        'comments': d.get('comments'),
        'resume_filename': d.get('resume_filename'),
        'resume_url': d.get('resume_url'),
        'created_at': d.get('created_at').isoformat() if d.get('created_at') else None,
        'feedback': d.get('feedback', '')
    }
    return out


@router.put('/registrations/{item_id}/feedback')
async def update_feedback(item_id: str, payload: dict, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    
    d = await db.cogent_labs_registrations.find_one({'_id': oid})
    if not d:
        raise HTTPException(status_code=404, detail='Not found')
    
    feedback = payload.get('feedback', '').strip()
    await db.cogent_labs_registrations.update_one(
        {'_id': oid},
        {'$set': {'feedback': feedback, 'feedback_updated_at': datetime.utcnow()}}
    )
    
    return {'ok': True, 'feedback': feedback}


@router.delete('/registrations/{item_id}')
async def delete_registration(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    """Delete a registration record. If the record contains a Cloudinary public_id,
    attempt to remove the raw resource from Cloudinary as well.
    """
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')

    d = await db.cogent_labs_registrations.find_one({'_id': oid})
    if not d:
        raise HTTPException(status_code=404, detail='Not found')

    public_id = d.get('resume_public_id')
    # Attempt to delete Cloudinary resource if we have a public_id
    if public_id:
        try:
            res = cloudinary.uploader.destroy(public_id, resource_type='raw')
            logging.getLogger(__name__).info(f'Deleted Cloudinary resource {public_id} -> {res}')
        except Exception:
            logging.getLogger(__name__).exception(f'Failed to delete Cloudinary resource {public_id} (continuing with DB delete)')

    # Delete the DB record
    await db.cogent_labs_registrations.delete_one({'_id': oid})
    logging.getLogger(__name__).info(f'Deleted registration id={item_id} by admin')
    return {'ok': True}


@router.get('/registrations/preview/{item_id}')
async def preview_registration_resume(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    # Proxy the stored resume URL and stream it inline so admin can preview without download.
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    d = await db.cogent_labs_registrations.find_one({'_id': oid})
    if not d or not d.get('resume_url'):
        raise HTTPException(status_code=404, detail='No resume found')

    resume_url = d.get('resume_url')
    filename = d.get('resume_filename') or 'resume'

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(resume_url, timeout=30.0)
        except Exception as e:
            raise HTTPException(status_code=502, detail='Failed to fetch resume')

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail='Failed to fetch resume')

    content_type = resp.headers.get('content-type') or 'application/octet-stream'
    data = resp.content
    # Determine file extension from stored filename or URL to prefer correct media type
    file_ext = None
    try:
        if filename and '.' in filename:
            file_ext = filename.rsplit('.', 1)[-1].lower()
        else:
            # try URL
            import urllib.parse
            path = urllib.parse.urlparse(resume_url).path
            if '.' in path:
                file_ext = path.rsplit('.', 1)[-1].lower()
    except Exception:
        file_ext = None

    # Force PDF media type when we detect a pdf extension or content-type contains 'pdf'
    if file_ext == 'pdf' or ('pdf' in (content_type or '').lower()):
        media_type = 'application/pdf'
    else:
        media_type = content_type

    # For Office document formats, return an HTML wrapper that embeds
    # Microsoft Office Online viewer so the document can be previewed inline
    # in an iframe instead of forcing a download. This requires the resume
    # URL to be publicly accessible (Cloudinary URLs usually are).
    office_exts = ('doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'rtf')
    try:
        import urllib.parse
        if file_ext in office_exts:
            viewer_url = f"https://view.officeapps.live.com/op/embed.aspx?src={urllib.parse.quote(resume_url, safe='') }"
            html = f'''<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview - {filename}</title></head>
<body style="margin:0;height:100vh;">
  <iframe src="{viewer_url}" style="border:0; width:100%; height:100vh;" frameborder="0" allowfullscreen></iframe>
</body></html>'''
            headers_html = {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Frame-Options': 'ALLOWALL'
            }
            logging.getLogger(__name__).info(f'Using Office viewer for resume id={item_id} ext={file_ext} url={resume_url}')
            return Response(content=html, media_type='text/html', headers=headers_html)
    except Exception:
        # fallback to raw proxy if anything goes wrong
        logging.getLogger(__name__).exception('Failed to prepare office viewer; falling back to proxy')

    headers = {
        'Content-Disposition': f'inline; filename="{filename}"',
        # Allow embedding in iframe
        'X-Frame-Options': 'ALLOWALL'
    }

    # Log for debugging if preview issues persist
    try:
        logging.getLogger(__name__).info(f'Previewing resume id={item_id} url={resume_url} content_type={content_type} forced_media_type={media_type}')
    except Exception:
        pass

    return Response(content=data, media_type=media_type, headers=headers)


@router.get('/cogent-labs/registrations/status')
async def get_registrations_status(db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    s = await db.settings.find_one({'_id': 'cogent_labs_registrations'})
    if not s:
        return {'open': True}
    return {'open': bool(s.get('open', True))}


@router.post('/cogent-labs/registrations/status')
async def set_registrations_status(payload: RegistrationStatus = Body(...), db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    await db.settings.update_one({'_id': 'cogent_labs_registrations'}, {'$set': {'open': bool(payload.open)}}, upsert=True)
    return {'open': bool(payload.open)}


@router.post('/registrations/{item_id}/send-feedback')
async def send_feedback_email(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_cogentlabs_token)):
    """Send feedback email to the registered student"""
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    
    # Get registration data
    registration = await db.cogent_labs_registrations.find_one({'_id': oid})
    if not registration:
        raise HTTPException(status_code=404, detail='Registration not found')
    
    # Check if feedback exists
    feedback = registration.get('feedback', '').strip()
    if not feedback:
        raise HTTPException(status_code=400, detail='No feedback available to send. Please add feedback first.')
    
    # Get email configuration
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    receiver_email = registration.get('email')
    
    if not sender_email or not app_password:
        raise HTTPException(status_code=500, detail='Email configuration not found...')
    
    if not receiver_email:
        raise HTTPException(status_code=400, detail='Student email not found')
    
    # Load and customize the HTML template
    template_path = Path(__file__).parent.parent.parent / "templates" / "cogent_labs_feedback.html"
    
    if not template_path.exists():
        # Fallback to a simple template if file not found
        html_content = f"""
        <html>
        <body>
            <h2>Mock Interview Feedback - Cogent Labs</h2>
            <p>Dear {registration.get('name', 'Student')},</p>
            <p>Thank you for participating in the Cogent Labs Mock Interview session.</p>
            <h3>Your Feedback:</h3>
            <p>{feedback}</p>
            <p>Best regards,<br>Cogent Labs Team</p>
            <p>© {datetime.now().year} Cogent Labs. All rights reserved.</p>
        </body>
        </html>
        """
    else:
        with open(template_path, 'r', encoding='utf-8') as file:
            template_content = file.read()
        
        # Create Jinja2 template
        template = Template(template_content)
        
        # Render template with variables
        html_content = template.render(
            name=registration.get('name', 'Student'),
            batch=registration.get('batch', ''),
            campus=registration.get('campus', ''),
            feedback=feedback,
            timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            year=datetime.now().year
        )
    
    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Mock Interview Feedback - Cogent Labs"
    msg["From"] = sender_email
    msg["To"] = receiver_email
    
    # Create the plain-text version of your message
    text = f"""
    Mock Interview Feedback - Cogent Labs
    
    Dear {registration.get('name', 'Student')},
    
    Thank you for participating in the Cogent Labs Mock Interview session.
    
    Your Feedback:
    {feedback}
    
    Best regards,
    Cogent Labs Team
    
    © {datetime.now().year} Cogent Labs. All rights reserved.
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
        
        # Update registration to mark feedback as sent
        await db.cogent_labs_registrations.update_one(
            {'_id': oid},
            {'$set': {'feedback_sent_at': datetime.utcnow()}}
        )
        
        logging.getLogger(__name__).info(f'Feedback email sent to {receiver_email} for registration {item_id}')
        return {'ok': True, 'message': 'Feedback email sent successfully'}
    except Exception as e:
        logging.getLogger(__name__).exception(f'Failed to send feedback email to {receiver_email}: {e}')
        raise HTTPException(status_code=500, detail=f'Failed to send email: {str(e)}')

