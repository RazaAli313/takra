
   
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import aiosmtplib
from email.message import EmailMessage
from backend.config import ADMIN_EMAIL
router = APIRouter()
# SMTP Config (you must use your own email and App Password for Gmail)
import os
SMTP_USER = os.getenv("ADMIN_EMAIL", "contact@taakra2026.com")             # <-- your Gmail
SMTP_PASS = os.getenv("ADMIN_EMAIL_PASSWORD", "")                # <-- App Password
RECEIVER_EMAIL = os.getenv("ADMIN_EMAIL", "contact@taakra2026.com")

@router.post("/contact")
async def send_email(data: Contact):
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = RECEIVER_EMAIL
    msg["Subject"] = f"New Contact Message from {data.name}"
    msg.set_content(f"""
Name: {data.name}
Email: {data.email}
Message:
{data.message}
""")

    try:
        print("hello")
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )
        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


def send_email_notification(contact: ContactMessage):
    print("Email sending")
    sender_email = os.getenv("ADMIN_EMAIL", "contact@taakra2026.com")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD", "")
    receiver_email =sender_email  # Or a team email inbox

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"FDC-Website New Contact Form Submission!!!"
    msg["From"] = sender_email
    msg["To"] = receiver_email

    text = f"""
    You have received a new message from your contact form:
    
    Name: {contact.name}
    Email: {contact.email}
    Message: {contact.message}
    """

    msg.attach(MIMEText(text, "plain"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
    except Exception as e:
        print("Error sending email:", e)