import cloudinary
import secrets
import io
import os
from fastapi import UploadFile, HTTPException, status
from PIL import Image, UnidentifiedImageError
import cloudinary.uploader
import logging

logger = logging.getLogger(__name__)


async def save_uploaded_image(file: UploadFile, image_type: str = "misc",cloudinary_type:str="MISC") -> str:
    UPLOAD_PRESET = "fdc-website"
    cloudinary.config(
    cloud_name=os.getenv(f"{cloudinary_type}_CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv(f"{cloudinary_type}_CLOUDINARY_API_KEY"),
    api_secret=os.getenv(f"{cloudinary_type}_CLOUDINARY_API_SECRET")
    )
    """Validate, process, and upload an image to Cloudinary using unsigned upload."""
    try:
        logger.info(f"Processing {image_type} image upload: {file.filename}")   

        # --- Step 1: Validate file ---
        if not file.filename:
            raise ValueError("No filename provided")
        if not file.content_type or not file.content_type.startswith("image/"):
            raise ValueError("Only image files are allowed")

        contents = await file.read()
        if not contents:
            raise ValueError("Empty file received")
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            raise ValueError("Image exceeds 10MB size limit")

        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ['jpg', 'jpeg', 'png', 'webp']:
            raise ValueError("Only JPG, PNG, or WEBP images are allowed")

        # --- Step 2: Process image ---
        try:
            with Image.open(io.BytesIO(contents)) as img:
                img.verify()  # Confirm it's a real image

            with Image.open(io.BytesIO(contents)) as img:
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                img.thumbnail((1200, 800))  # Resize while maintaining aspect ratio

                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=85, optimize=True)
                buffer.seek(0)

        except UnidentifiedImageError:
            raise ValueError("Invalid image file (cannot identify)")
        except Exception as img_error:
            raise ValueError(f"Image processing failed: {str(img_error)}")

        # --- Step 3: Upload to Cloudinary (unsigned) ---
        result = cloudinary.uploader.unsigned_upload(
            buffer,
            upload_preset=UPLOAD_PRESET,
            folder=f"{image_type}_images"
        )

        image_url = result.get("secure_url")
        if not image_url:
            raise ValueError("Cloudinary upload returned no URL")

        logger.info(f"Successfully uploaded image to Cloudinary: {image_url}")
        return image_url

    except Exception as e:
        logger.error(f"Image upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image validation failed: {str(e)}"
        )
    finally:
        await file.close()