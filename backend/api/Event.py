
# --- All imports at the top ---
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
import os
import logging
from pymongo import ReturnDocument
import json
from fastapi import HTTPException, APIRouter, status,Query, Form, Depends,  UploadFile, File, BackgroundTasks,Request
from bson import ObjectId
from datetime import datetime
from typing import List
from backend.Schemas.Event import  EventInDB, EventRegistration, PaymentResponse
from backend.config.database.init import get_event_db
from backend.utils.CloudinaryImageUploader import save_uploaded_image
router = APIRouter()
from bson import ObjectId
from backend.config.limiter import _limiter as limiter
from datetime import datetime
from fastapi import  UploadFile, File
from backend.config.database.init import get_event_db
from dotenv import load_dotenv
import logging

from pymongo import ReturnDocument
import json
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Email sender implementation ---
def send_email_notification(email_data):
    smtp_server = os.getenv("SMTP_SERVER")  # Change to your SMTP server
    smtp_port = os.getenv("SMTP_PORT") 
    smtp_user = os.getenv("ADMIN_EMAIL")  # Change to your email
    smtp_password = os.getenv("ADMIN_EMAIL_PASSWORD")  # Use app password or env var

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = email_data["to"]
    msg["Subject"] = email_data["subject"]
    msg.attach(MIMEText(email_data["html"], "html"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, email_data["to"], msg.as_string())
    except Exception as e:
        print(f"Failed to send email to {email_data['to']}: {e}")



def send_team_email(template_name, subject, registration, event_name=None):
    template_dir = os.path.join(os.path.dirname(__file__), '../templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template(template_name)
    year = datetime.utcnow().year
    email_body = template.render(
        event_name=event_name,
        team_name=registration["team_name"],
        members=registration["members"],
        modules=registration.get("modules", []),
        year=year
    )
    for member in registration["members"]:
        if member["email"]:
            send_email_notification({
                "to": member["email"],
                "subject": subject,
                "html": email_body
            })
@router.post("/events/{event_id}/registrations/{team_name}")
@limiter.limit("2/day")
async def register_team(request:Request,event_id: str, team_name: str, registration: dict, db=Depends(get_event_db), background_tasks: BackgroundTasks = None):
    # Enforce uniqueness: no member email can register more than once per event
    member_emails = [m["email"] for m in registration.get("members", []) if m.get("email")]
    if not member_emails:
        raise HTTPException(status_code=400, detail="No member emails provided")
    # Check for any existing registration for this event with any of these emails
    for email in member_emails:
        existing = await db.event_registrations.find_one({"event_id": event_id, "members.email": email})
        if existing:
            raise HTTPException(status_code=400, detail=f"Email {email} has already registered for this event")
    # ...existing registration logic...
    # After saving registration, send pending email in background
    if background_tasks:
        background_tasks.add_task(
            send_team_email,
            template_name="pending_registration.html",
            subject=f"Event Registration Pending - {team_name}",
            registration=registration
        )
    return {"message": "Registration submitted. Email will be sent in background."}




@router.post("/events/{event_id}/registrations/{team_name}/approve")
async def approve_registration(event_id: str, team_name: str, db=Depends(get_event_db), background_tasks: BackgroundTasks = None):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    registration = await db.event_registrations.find_one({"event_id": event_id, "team_name": team_name})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    await db.event_registrations.update_one({"_id": registration["_id"]}, {"$set": {"payment_status": "approved"}})
    # Get event name
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    event_name = event["title"] if event else ""
    # Send approval email to all team members in background
    if background_tasks:
        background_tasks.add_task(
            send_team_email,
            template_name="registration_approved.html",
            subject=f"Event Registration Approved - {registration['team_name']}",
            registration=registration,
            event_name=event_name
        )
    return {"message": "Registration approved. Email will be sent in background."}

@router.post("/events/{event_id}/registrations/{team_name}/reject")
async def reject_registration(event_id: str, team_name: str, db=Depends(get_event_db)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    registration = await db.event_registrations.find_one({"event_id": event_id, "team_name": team_name})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    await db.event_registrations.update_one({"_id": registration["_id"]}, {"$set": {"payment_status": "rejected"}})
    # Optionally send rejection email here
    return {"message": "Registration rejected."}
def event_helper(event) -> dict:
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "date": event["date"],
        "time": event["time"],
        "location": event["location"],
        "description": event["description"],
        "image_url": event.get("image_url"),
        "registration_open": event.get("registration_open", True),
        "modules": event.get("modules", []),
        "module_amounts": event.get("module_amounts", {}),
        "discount_codes": event.get("discount_codes", []),
        "category_id": event.get("category_id"),
        "category_name": event.get("category_name"),
        "rules": event.get("rules", ""),
        "prizes": event.get("prizes", ""),
        "deadline": event.get("deadline"),
        "created_at": event["created_at"],
        "updated_at": event["updated_at"]
    }



@router.get("/events", response_model=List[EventInDB])
async def get_events(db=Depends(get_event_db)):
    events = []
    async for event in db.events.find().sort("created_at", -1):
        events.append(event_helper(event))
    return events


@router.post("/events", response_model=EventInDB, status_code=status.HTTP_201_CREATED)
async def create_event(
    title: str = Form(...),
    date: str = Form(...),
    time: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    registration_open: bool = Form(True),
    modules: str = Form(""),  # comma-separated
    module_amounts: str = Form(""),  # e.g. "Coding:500,AI:700"
    image: UploadFile = File(None),
    discount_codes: str = Form(""),
    # Taakra fields
    category_id: str = Form(None),
    category_name: str = Form(None),
    rules: str = Form(None),
    prizes: str = Form(None),
    deadline: str = Form(None),
    db=Depends(get_event_db)
):
    now = datetime.utcnow()
    image_url = None
    if image:
        image_url = await save_uploaded_image(image, "events","EVENTS")
    # Parse modules
    modules_list = [m.strip() for m in modules.split(",") if m.strip()] if modules else []
    # Parse module_amounts
    module_amounts_dict = {}
    if module_amounts:
        for pair in module_amounts.split(","):
            if ":" in pair:
                name, amt = pair.split(":", 1)
                try:
                    module_amounts_dict[name.strip()] = int(amt.strip())
                except ValueError:
                    continue
    # Parse discount_codes
    discount_codes_list = []
    if discount_codes:
        try:
            discount_codes_list = json.loads(discount_codes)
        except Exception:
            discount_codes_list = []
    event_data = {
        "title": title,
        "date": date,
        "time": time,
        "location": location,
        "description": description,
        "registration_open": registration_open,
        "image_url": image_url,
        "modules": modules_list,
        "module_amounts": module_amounts_dict,
        "discount_codes": discount_codes_list,
        "category_id": category_id or None,
        "category_name": category_name or None,
        "rules": rules or "",
        "prizes": prizes or "",
        "deadline": deadline or None,
        "created_at": now,
        "updated_at": now
    }
    result = await db.events.insert_one(event_data)
    created_event = await db.events.find_one({"_id": result.inserted_id})
    return event_helper(created_event)

@router.put("/events/{event_id}", response_model=EventInDB)
async def update_event(
    event_id: str,
    title: str = Form(...),
    date: str = Form(...),
    time: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    registration_open: bool = Form(True),
    modules: str = Form(""),
    module_amounts: str = Form(""),
    competitions: str = Form("[]"),
    image: UploadFile = File(None),
    discount_codes: str = Form(""),
    category_id: str = Form(None),
    category_name: str = Form(None),
    rules: str = Form(None),
    prizes: str = Form(None),
    deadline: str = Form(None),
    db=Depends(get_event_db)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    now = datetime.utcnow()
    
    # Parse modules
    modules_list = [m.strip() for m in modules.split(",") if m.strip()] if modules else []
    # Parse module_amounts
    module_amounts_dict = {}
    if module_amounts:
        for pair in module_amounts.split(","):
            if ":" in pair:
                name, amt = pair.split(":", 1)
                try:
                    module_amounts_dict[name.strip()] = int(amt.strip())
                except ValueError:
                    continue
    # Parse competitions from JSON string to list
    try:
        competitions_list = json.loads(competitions)
    except json.JSONDecodeError:
        competitions_list = []
    # Parse discount_codes
    discount_codes_list = []
    if discount_codes:
        try:
            discount_codes_list = json.loads(discount_codes)
        except Exception:
            discount_codes_list = []
    update_data = {
        "title": title,
        "date": date,
        "time": time,
        "location": location,
        "description": description,
        "registration_open": registration_open,
        "modules": modules_list,
        "module_amounts": module_amounts_dict,
        "competitions": competitions_list,
        "discount_codes": discount_codes_list if discount_codes_list is not None else [],
        "category_id": category_id or None,
        "category_name": category_name or None,
        "rules": rules or "",
        "prizes": prizes or "",
        "deadline": deadline or None,
        "updated_at": now
    }
    # Handle image upload
    if image:
        update_data["image_url"] = await save_uploaded_image(image, "events","EVENTS")
    else:
        # If no image provided, keep existing image_url
        existing_event = await db.events.find_one({"_id": ObjectId(event_id)})
        update_data["image_url"] = existing_event.get("image_url", "")

    updated_event = await db.events.find_one_and_update(
        {"_id": ObjectId(event_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found")

    return event_helper(updated_event)

@router.post("/events/{event_id}/discount/validate")
async def validate_discount_code(event_id: str, code: str = Form(...), module: str = Form(...), db=Depends(get_event_db)):
    """
    Validate a discount code for a given event and module.
    """
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    discount_codes = event.get("discount_codes", [])
    for d in discount_codes:
        if d.get("code") == code and d.get("module") == module:
            return {"amount": d.get("amount", 0), "message": f"Discount code '{code}' applied!"}
    raise HTTPException(status_code=404, detail="Discount code not found or invalid for selected module")


@router.get("/events/{event_id}/check-team-name")
async def check_team_name_available(
    event_id: str,
    team_name: str = Query(""),
    db=Depends(get_event_db)
):
    """
    Real-time check if a team name is available for this event.
    Returns { "available": true } if not taken, { "available": false } if already registered.
    """
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    name = (team_name or "").strip()
    if not name:
        return {"available": True}
    existing = await db.event_registrations.find_one({
        "event_id": event_id,
        "team_name": name
    })
    return {"available": existing is None}


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: str, db=Depends(get_event_db)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Delete associated registrations first
    await db.event_registrations.delete_many({"event_id": event_id})
    
    delete_result = await db.events.delete_one({"_id": ObjectId(event_id)})
    
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return None

@router.post("/events/{event_id}/register", status_code=status.HTTP_201_CREATED)
async def register_for_event(event_id: str, registration: EventRegistration, db=Depends(get_event_db)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.get("registration_open", True):
        raise HTTPException(status_code=400, detail="Registration is closed for this event")
    modules = registration.modules if registration.modules else []
    competition = getattr(registration, 'competition', None)
    if not modules and competition:
        modules = [competition]
    if not modules or len(modules) == 0:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one competition/module."
        )
    registration_data = registration.dict()
    registration_data["modules"] = modules
    registration_data["event_id"] = event_id
    registration_data["created_at"] = datetime.utcnow()
    existing_registration = await db.event_registrations.find_one({
        "event_id": event_id,
        "team_name": registration.team_name
    })
    if existing_registration:
        raise HTTPException(
            status_code=400,
            detail="This team is already registered for this event"
        )
    await db.event_registrations.insert_one(registration_data)

    # Get module registration counts
    module_counts = {}
    for module in modules:
        module_counts[module] = await db.event_registrations.count_documents({"event_id": event_id, "modules": module})

    # Pending registration email is sent after step 3 (payment submission), not here.

    # Send admin notification email
    template_dir = os.path.join(os.path.dirname(__file__), '../templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    year = datetime.utcnow().year
    admin_template = env.get_template('new_registration_admin_notification.html')
    admin_body = admin_template.render(
        event_name=event.get("title", ""),
        team_name=registration.team_name,
        registration_time=registration_data["created_at"].strftime('%Y-%m-%d %H:%M:%S'),
        members=registration.members,
        modules=modules,
        module_registration_count=module_counts,
        year=year
    )
    send_email_notification({
        "to": os.getenv("ADMIN_EMAIL", "contact@taakra2026.com"),
        "subject": f"New Event Registration - {registration.team_name}",
        "html": admin_body
    })

    return {"message": "Registration successful, pending approval."}

@router.get("/events/{event_id}/registrations", response_model=List[EventRegistration])
async def get_event_registrations(event_id: str, db=Depends(get_event_db)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    registrations = []
    async for reg in db.event_registrations.find({"event_id": event_id}).sort("created_at", -1):
        # Ensure all relevant fields are present for admin view
        registration = {
            "team_name": reg.get("team_name", ""),
            "members": reg.get("members", []),
            "modules": reg.get("modules", []),
            "payment_status": reg.get("payment_status", "pending"),
            "transaction_id": reg.get("transaction_id", None),
            "payment_receipt_url": reg.get("payment_receipt_url", None),
            "discount_codes_used": reg.get("discount_codes_used", []),
        }
        registrations.append(registration)
    return registrations

@router.post("/events/{event_id}/payment", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def submit_payment_receipt(
    event_id: str,
    receipt: UploadFile = File(...),
    transaction_id: str = Form(None),
    transactionId: str = Form(None),
    email: str = Form(None),
    team_name: str = Form(None),
    competition: str = Form(...),
    discount_codes: str = Form(None),
    db=Depends(get_event_db)
):
    """
    Submit payment receipt for an event registration using Cloudinary.
    discount_codes: optional JSON string of { "module": "code" } for tracking codes used.
    Pending registration email is sent after payment submission (step 3).
    """
    # Validate event ID
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Use whichever transaction ID is provided
    final_transaction_id = transaction_id or transactionId
    
    if not final_transaction_id:
        raise HTTPException(status_code=400, detail="Transaction ID is required")
    
    # Parse discount codes used: JSON { "module": "code" } or list of { "module", "code" }
    discount_codes_used = []
    if discount_codes and discount_codes.strip():
        try:
            parsed = json.loads(discount_codes)
            if isinstance(parsed, list):
                discount_codes_used = [{"module": str(p.get("module", "")), "code": str(p.get("code", ""))} for p in parsed if p.get("module") and p.get("code")]
            elif isinstance(parsed, dict):
                discount_codes_used = [{"module": k, "code": str(v)} for k, v in parsed.items() if k and v]
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Check if event exists
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Build query to find registration by team_name first, then email
    query = {"event_id": event_id}
    if team_name:
        query["team_name"] = team_name
    elif email:
        query["members.email"] = email
    else:
        raise HTTPException(
            status_code=400,
            detail="Either team_name or email is required"
        )
    
    # Check if registration exists
    registration = await db.event_registrations.find_one(query)
    
    if not registration:
        if email:
            error_detail = f"No registration found for email: {email}"
        else:
            error_detail = f"No registration found for team: {team_name}"
        raise HTTPException(
            status_code=404, 
            detail=error_detail
        )
    
    # Validate the competition/module exists in the event
    event_modules = event.get("modules", [])
    event_competitions = event.get("competitions", [])
    
    # Check if competition exists in either modules or competitions
    if competition not in event_modules and competition not in event_competitions:
        raise HTTPException(
            status_code=400, 
            detail=f"Competition/Module '{competition}' is not available for this event"
        )
    
    try:
        # Use your existing Cloudinary upload method
        receipt_url = await save_uploaded_image(receipt, "events",'EVENTS')
        
        # Update registration with payment information and discount codes used
        update_data = {
            "payment_receipt_url": receipt_url,
            "transaction_id": final_transaction_id,
            "payment_status": "submitted",
            "payment_submitted_at": datetime.utcnow(),
            "competition": competition,
            "discount_codes_used": discount_codes_used
        }
        
        await db.event_registrations.update_one(
            {"_id": registration["_id"]},
            {"$set": update_data}
        )
        
        # Send pending registration email after step 3 (payment submission)
        template_dir = os.path.join(os.path.dirname(__file__), '../templates')
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template('pending_registration.html')
        year = datetime.utcnow().year
        updated_reg = await db.event_registrations.find_one({"_id": registration["_id"]})
        email_body = template.render(
            event_name=event.get("title", ""),
            team_name=updated_reg.get("team_name", ""),
            members=updated_reg.get("members", []),
            modules=updated_reg.get("modules", []),
            year=year
        )
        for member in updated_reg.get("members", []):
            if member.get("email"):
                send_email_notification({
                    "to": member["email"],
                    "subject": f"Event Registration Pending - {updated_reg.get('team_name', '')}",
                    "html": email_body
                })
        
        return {
            "message": "Payment receipt submitted successfully",
            "receipt_url": receipt_url,
            "transaction_id": final_transaction_id
        }
        
    except HTTPException as e:
        # Re-raise HTTP exceptions from save_uploaded_image
        raise e
    except Exception as e:
        logger.error(f"Error processing payment receipt: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to process payment receipt"
        )

@router.get("/events/{event_id}/payment-status/{identifier}")
async def get_payment_status(
    event_id: str, 
    identifier: str, 
    identifier_type: str = Query("email", description="Type of identifier: 'email' or 'team_name'"),
    db=Depends(get_event_db)
):
    """ 
    Get payment status for a specific event registration by email or team name
    """
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Build query based on identifier type
    query = {"event_id": event_id}
    
    if identifier_type == "email":
        query["members.email"] = identifier
    elif identifier_type == "team_name":
        query["team_name"] = identifier
    else:
        raise HTTPException(status_code=400, detail="Invalid identifier type. Use 'email' or 'team_name'")
    
    registration = await db.event_registrations.find_one(query)
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {
        "team_name": registration.get("team_name"),
        "payment_status": registration.get("payment_status", "pending"),
        "transaction_id": registration.get("transaction_id"),
        "receipt_url": registration.get("payment_receipt_url"),
        "submitted_at": registration.get("payment_submitted_at"),
        "modules": registration.get("modules", [])
    }
