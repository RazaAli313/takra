# routers/subscribe.py
from fastapi import APIRouter, HTTPException, status, Depends,Request
from backend.Schemas.Subscriber import Subscriber 
from datetime import datetime
import backend.config.database.init as config
from backend.config.database.init import get_misc_db
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import smtplib

from backend.config.limiter import _limiter as limiter
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
import os

router = APIRouter()

@router.post("/subscribe")
@limiter.limit("2/day")
async def subscribe(request:Request,subscriber: Subscriber, db=Depends(get_misc_db)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    # Check if already subscribed
    existing = await db.subscribers.find_one({"email": subscriber.email})
    print("Existing:",existing)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already subscribed."
        )

    # Prepare data
    new_subscriber = { 
        "email": subscriber.email,
        "subscribed_at": subscriber.subscribed_at or datetime.utcnow()
    }

    # Insert into DB
    await db.subscribers.insert_one(new_subscriber)

    # Send subscription confirmation email
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    receiver_email = subscriber.email
    template_path = Path(__file__).parent.parent / "templates" / "subscribe_notification.html"
    if not template_path.exists():
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to FCIT Developers Club Newsletter!</h2>
            <p>Thank you for subscribing. You'll now receive updates on our latest events, workshops, and club news.</p>
            <p>If you did not subscribe, please ignore this email or contact us.</p>
            <div style='margin-top:32px;font-size:0.9em;color:#888;'>
                &copy; {datetime.now().year} FCIT Developers Club. All rights reserved.
            </div>
        </body>
        </html>
        """
    else:
        with open(template_path, 'r') as file:
            template_content = file.read()
        template = Template(template_content)
        html_content = template.render(
            email=subscriber.email,
            year=datetime.now().year
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Subscription Confirmation - FCIT Developers Club"
    msg["From"] = sender_email
    msg["To"] = receiver_email
    text = f"""
    Thank you for subscribing to FCIT Developers Club newsletter!
    You'll now receive updates on our latest events, workshops, and club news.
    If you did not subscribe, please ignore this email or contact us.
    """
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html_content, "html")
    msg.attach(part1)
    msg.attach(part2)
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("Subscription email sent successfully!")
    except Exception as e:
        print("Error sending subscription email:", e)

    return {"message": "Subscription successful", "email": subscriber.email}