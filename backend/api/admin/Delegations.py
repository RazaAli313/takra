from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import StreamingResponse, Response
from backend.config.database.init import get_misc_db
from backend.middleware.auth.token import verify_token
from typing import List
from bson import ObjectId
import io, csv
import httpx
import logging
import cloudinary.uploader

router = APIRouter()


@router.get('/delegations')
async def list_delegations(db=Depends(get_misc_db), auth=Depends(verify_token)):
    items = []
    async for d in db.delegations.find().sort('created_at', -1):
        items.append({
            'id': str(d.get('_id')),
            'name': d.get('name'),
            'email': d.get('email'),
            'phone': d.get('phone'),
            'batch': d.get('batch'),
            'campus': d.get('campus'),
            'created_at': d.get('created_at')
        })
    return items


@router.get('/delegations/export')
async def export_delegations_csv(request: Request, db=Depends(get_misc_db), auth=Depends(verify_token)):
    # Log incoming request metadata for debugging when export fails with 400
    try:
        logger = logging.getLogger(__name__)
        try:
            hdr_token = request.headers.get('adminAuthToken') or request.cookies.get('adminAuthToken')
            logger.info(f"Export requested from {request.client.host} hdr_admin_token_present={bool(hdr_token)} cookies_present={len(request.cookies)>0}")
        except Exception:
            logger.exception('Failed to log request auth info')
        # Build CSV in-memory similarly to registrations export for compatibility
        cursor = db.delegations.find().sort('created_at', -1)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['id', 'name', 'cnic', 'email', 'phone', 'batch', 'campus', 'why_join', 'comments', 'resume_filename', 'resume_url', 'created_at'])
        async for r in cursor:
            writer.writerow([
                str(r.get('_id')),
                r.get('name', ''),
                r.get('cnic', ''),
                r.get('email', ''),
                r.get('phone', ''),
                r.get('batch', ''),
                r.get('campus', ''),
                r.get('why_join', ''),
                r.get('comments', ''),
                r.get('resume_filename', ''),
                r.get('resume_url', ''),
                r.get('created_at').isoformat() if r.get('created_at') else ''
            ])
        logging.getLogger(__name__).info('Admin CSV export requested')
        return Response(content=output.getvalue(), media_type='text/csv')
    except Exception:
        logging.exception('Failed to generate delegations CSV')
        raise HTTPException(status_code=500, detail='Failed to generate CSV')


@router.get('/delegations/export-debug')
async def export_delegations_csv_debug():
    """Temporary unauthenticated debug endpoint to verify CSV generation independently of auth.
    Returns a tiny sample CSV. Remove this endpoint after debugging.
    """
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['id', 'name', 'email'])
        writer.writerow(['debug-1', 'Debug User', 'debug@example.com'])
        return Response(content=output.getvalue(), media_type='text/csv')
    except Exception:
        logging.exception('Failed to generate debug CSV')
        raise HTTPException(status_code=500, detail='Failed to generate debug CSV')


@router.get('/debug/echo')
async def debug_echo(request: Request):
    """Return a small JSON payload containing headers and cookie presence to help debug client->server headers.
    Temporary - remove after debugging.
    """
    try:
        headers = {k: v for k, v in request.headers.items() if k.lower() in ('adminauthtoken','masterauthtoken','host','user-agent','origin')}
        cookies = {k: request.cookies.get(k) for k in ('adminAuthToken','masterAuthToken')}
        info = {
            'client': getattr(request.client, 'host', None),
            'headers': headers,
            'cookies': {k: bool(v) for k, v in cookies.items()}
        }
        logging.getLogger(__name__).info(f"Debug echo: {info}")
        return info
    except Exception:
        logging.getLogger(__name__).exception('Failed to run debug echo')
        raise HTTPException(status_code=500, detail='debug echo failed')


@router.get('/delegations/auth-test')
async def delegations_auth_test(auth=Depends(verify_token)):
    """Simple endpoint to verify admin token decoding via the `verify_token` dependency.
    Returns a minimal JSON response so clients can confirm their token is accepted.
    Temporary: remove after debugging.
    """
    try:
        logging.getLogger(__name__).info('delegations/auth-test: verify_token passed')
    except Exception:
        pass
    return {"ok": True}


@router.get('/delegations/{item_id}')
async def get_delegation(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_token)):
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    d = await db.delegations.find_one({'_id': oid})
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
        'created_at': d.get('created_at').isoformat() if d.get('created_at') else None
    }
    return out


@router.delete('/delegations/{item_id}')
async def delete_delegation(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_token)):
    """Delete a delegation record. If the record contains a Cloudinary public_id,
    attempt to remove the raw resource from Cloudinary as well.
    """
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')

    d = await db.delegations.find_one({'_id': oid})
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
    await db.delegations.delete_one({'_id': oid})
    logging.getLogger(__name__).info(f'Deleted delegation id={item_id} by admin')
    return {'ok': True}


@router.get('/delegations/preview/{item_id}')
async def preview_delegation_resume(item_id: str, db=Depends(get_misc_db), auth=Depends(verify_token)):
    # Proxy the stored resume URL and stream it inline so admin can preview without download.
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    d = await db.delegations.find_one({'_id': oid})
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
 
