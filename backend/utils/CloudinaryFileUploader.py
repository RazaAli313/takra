import cloudinary
import os
import logging
import secrets
from fastapi import UploadFile, HTTPException, status
import cloudinary.uploader

logger = logging.getLogger(__name__)


async def save_uploaded_file(file: UploadFile, file_type: str = "resumes", cloudinary_type: str = "MISC") -> str:
    """Upload a non-image file (pdf/doc/docx) to Cloudinary as a raw resource and return secure_url.

    Expects environment variables like MISC_CLOUDINARY_CLOUD_NAME, MISC_CLOUDINARY_API_KEY, MISC_CLOUDINARY_API_SECRET
    """
    UPLOAD_PRESET = os.getenv('CLOUDINARY_UPLOAD_PRESET', '') or 'fdc-website'
    cloudinary.config(
        cloud_name=os.getenv(f"{cloudinary_type}_CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv(f"{cloudinary_type}_CLOUDINARY_API_KEY"),
        api_secret=os.getenv(f"{cloudinary_type}_CLOUDINARY_API_SECRET")
    )

    try:
        if not file.filename:
            raise ValueError("No filename provided")

        contents = await file.read()
        if not contents:
            raise ValueError("Empty file received")
        # 10MB limit for resumes by default
        if len(contents) > 10 * 1024 * 1024:
            raise ValueError("File exceeds 10MB size limit")

        # Accept only PDF resumes
        allowed = ['application/pdf']
        if file.content_type not in allowed:
            raise ValueError(f"Unsupported resume file type: {file.content_type}. Only PDF is allowed.")

        # Upload as raw resource
        # cloudinary.uploader.upload accepts file-like objects; pass bytes via temporary buffer
        import io
        buffer = io.BytesIO(contents)
        buffer.seek(0)

        # Build a safe public_id from filename (without extension) + short random suffix
        orig_name = os.path.splitext(file.filename)[0]
        safe_base = ''.join(c for c in orig_name if c.isalnum() or c in ('-', '_'))[:80]
        unique_suffix = secrets.token_hex(4)
        public_id = f"{safe_base}_{unique_suffix}"

        result = cloudinary.uploader.upload(
            buffer,
            resource_type='raw',
            folder=f"{file_type}",
            public_id=public_id,
            upload_preset=UPLOAD_PRESET
        )

        url = result.get('secure_url') or result.get('url')
        uploaded_public_id = result.get('public_id') or public_id
        if not url:
            raise ValueError('Cloudinary upload returned no URL')
        logger.info(f"Uploaded file to Cloudinary: {url} (public_id={uploaded_public_id})")
        return {'url': url, 'public_id': uploaded_public_id}

    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    finally:
        await file.close()
