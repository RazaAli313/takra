from fastapi import APIRouter,status, Depends, Request
from datetime import datetime
import logging
from bson import ObjectId
from backend.Schemas.Contact import ContactInfo, ContactMessage, ContactReply
from email.mime.text import MIMEText
from fastapi import HTTPException
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import smtplib
from pathlib import Path
import os
from backend.config.database.init import get_misc_db
import os
import asyncio
from dotenv import load_dotenv

from backend.config.limiter import _limiter as limiter
load_dotenv()

router=APIRouter()

async def get_contact_info(db=Depends(get_misc_db)):
    info = await db.contact_info.find_one({"_id": "contact_info"})
    if not info:
        # Initialize with default values
        default_info = {
            "_id": "contact_info",
            "email": "fcit-developers.club@pucit.edu.pk",
            "phone": "To be Added",
            "address": "PUCIT New Campus\nSamsani Road, Lahore",
            "updated_at": datetime.utcnow()
        }
        await db.contact_info.insert_one(default_info)
        return default_info
    return info

# Contact endpoints
@router.get("/contact", response_model=ContactInfo)
async def get_contact_information(contact_info=Depends(get_contact_info)):
    return contact_info

@router.put("/contact", response_model=ContactInfo)
async def update_contact_information(info: ContactInfo, db=Depends(get_misc_db)):
    updated_info = await db.contact_info.find_one_and_update(
        {"_id": "contact_info"},
        {"$set": {
            **info.dict(),
            "updated_at": datetime.utcnow()
        }},
        return_document=True
    )
    return updated_info

@router.post("/contact/messages", status_code=status.HTTP_201_CREATED)
@limiter.limit("1/day")
async def submit_contact_message( request: Request,message: ContactMessage, db=Depends(get_misc_db)):
    message_data = message.dict()
    message_data["created_at"] = datetime.utcnow()
    await db.contact_messages.insert_one(message_data)
    send_email_notification(message)
    return {"message": "Contact form submitted successfully"}

@router.get("/contact/messages", response_model=list[ContactMessage])
async def get_contact_messages(db=Depends(get_misc_db)):
    messages = []
    async for message in db.contact_messages.find().sort("created_at", -1):
        messages.append(message)
    return messages





async def send_contact_reply(contact: ContactReply):
    print("Email sending")
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    receiver_email = contact.email
    query=contact.query

    # Load and customize the HTML template
    template_path = Path(__file__).parent.parent / "templates" / "contact_reply.html"
    
    if not template_path.exists():
        # Fallback to a simple template if file not found
        html_content = f"""
        <html>
        <body>
            <h2>Contact Form Reply</h2>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Query:</strong> {contact.query}</p>
            <p><strong>Message:</strong> {contact.message}</p>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </body>
        </html>
        """
    else:
        with open(template_path, 'r') as file:
            template_content = file.read()
        
        # Create Jinja2 template
        template = Template(template_content)
        
        # Render template with variables
        html_content = template.render(
            email=contact.email,
            query=contact.query,
            message=contact.message,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            year=datetime.now().year
        )

    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Contact Form Reply from - FCIT Developers Club"
    msg["From"] = sender_email
    msg["To"] = receiver_email

    # Create the plain-text version of your message
    text = f"""
    You have received a reply from FCIT Developers Club:
    Query: {contact.query}
    Message: {contact.message}
    Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
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
        print("Email sent successfully!")
        return True
    except Exception as e:
        print("Error sending email:", e)
        return False

@router.post('/contact/reply')
async def reply_to_contact_message(reply: ContactReply):
    # Here you would typically send the reply to the original sender
    print("Replying to contact email:", reply.email)
    print("Replying to contact query:", reply.query)
    print("Replying to contact message:", reply.message)
    await send_contact_reply(reply)
    return reply

# Contact endpoints
@router.get("/contact", response_model=ContactInfo)
async def get_contact_information():
    contact_info = await get_contact_info()
    return contact_info

@router.put("/contact", response_model=ContactInfo)
async def update_contact_information(info: ContactInfo):
    updated_info = await db.contact_info.find_one_and_update(
        {"_id": "contact_info"},
        {"$set": {
            **info.dict(),
            "updated_at": datetime.utcnow()
        }},
        return_document=True
    )
    return updated_info

def get_template_path(filename):
    return Path(__file__).parent.parent / "templates" / filename

def send_email_notification(contact: ContactMessage):
    print("Email sending")
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    receiver_email = sender_email  # Or a team email inbox

    # Load and customize the HTML template
    template_path = Path(__file__).parent.parent / "templates" / "contact_notification.html"
    if not template_path.exists():
        html_content = f"""
        <html>
        <body>
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {getattr(contact, 'name', '')}</p>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Subject:</strong> {getattr(contact, 'subject', '')}</p>
            <p><strong>Message:</strong> {contact.message}</p>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </body>
        </html>
        """
    else:
        with open(template_path, 'r') as file:
            template_content = file.read()
        template = Template(template_content)
        html_content = template.render(
            name=getattr(contact, 'name', ''),
            email=contact.email,
            subject=getattr(contact, 'subject', ''),
            message=contact.message,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            year=datetime.now().year
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New Contact Form Submission - FCIT Developers Club"
    msg["From"] = sender_email
    msg["To"] = receiver_email

    text = f"""
    New contact form submission:
    Name: {getattr(contact, 'name', '')}
    Email: {contact.email}
    Subject: {getattr(contact, 'subject', '')}
    Message: {contact.message}
    Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html_content, "html")
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("Contact notification email sent successfully!")
        return True
    except Exception as e:
        print("Error sending contact notification email:", e)
        return False

    # Load and customize the HTML template