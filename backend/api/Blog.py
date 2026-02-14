from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi import Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from backend.Schemas.Blog import BlogPostInDB
from dotenv import load_dotenv  
load_dotenv()
import os
from backend.utils.CloudinaryImageUploader import save_uploaded_image
from backend.config.database.init import get_blog_db, get_misc_db
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import smtplib
from pathlib import Path

router=APIRouter()

class BlogSubmissionStatus(BaseModel):
    open: bool

async def send_comment_notification_email(post_title: str, commenter_name: str, commenter_email: str, comment_body: str, post_id: str, timestamp: str):
    """Send email notification to admins when a new blog comment is posted."""
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    
    # Recipient emails
    recipient_emails = [
        os.getenv("ADMIN_EMAIL", "contact@taakra2026.com"),
        "razaalipk313@gmail.com"
    ]
    
    # Load template
    template_path = Path("backend/templates/blog_comment_notification.html")
    
    if not template_path.exists():
        # Fallback HTML if template not found
        html_content = f"""
        <html>
        <body>
            <h2>New Blog Comment Received</h2>
            <p><strong>Blog Post:</strong> {post_title}</p>
            <p><strong>Commenter:</strong> {commenter_name} ({commenter_email})</p>
            <p><strong>Comment:</strong> {comment_body}</p>
            <p><strong>Submitted At:</strong> {timestamp}</p>
            <p><strong>Status:</strong> Pending Approval</p>
        </body>
        </html>
        """
    else:
        with open(template_path, 'r') as file:
            template_content = file.read()
        
        template = Template(template_content)
        admin_url = f"https://fdc-pucit.org/fake/blogs"  # Admin panel URL
        html_content = template.render(
            post_title=post_title,
            commenter_name=commenter_name,
            commenter_email=commenter_email,
            comment_body=comment_body,
            admin_url=admin_url,
            timestamp=timestamp,
            year=datetime.now().year
        )
    
    # Create plain text version
    text = f"""
    New Blog Comment Received - Taakra 2026
    
    Blog Post: {post_title}
    Commenter: {commenter_name} ({commenter_email})
    Comment: {comment_body}
    Submitted At: {timestamp}
    Status: Pending Approval
    
    Please review and approve the comment in the admin panel.
    """
    
    # Send email to each recipient
    for receiver_email in recipient_emails:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"New Blog Comment: {post_title} - Taakra 2026"
        msg["From"] = sender_email
        msg["To"] = receiver_email
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, app_password)
                server.sendmail(sender_email, receiver_email, msg.as_string())
            print(f"Comment notification email sent to {receiver_email}")
        except Exception as e:
            print(f"Error sending comment notification email to {receiver_email}: {e}")

 

# Blog post endpoints
@router.get("/posts", response_model=list[BlogPostInDB])
async def get_blog_posts(db=Depends(get_blog_db)):
    blogs = []
    async for post in db.blogs.find().sort("created_at", -1):
        blogs.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "excerpt": post["excerpt"],
            "content":post["content"],
            "author": post["author"],
            "read_time": post["read_time"],
            "image_url": post.get("image_url"),
            "likes": post.get("likes", 0),
            "created_at": post["created_at"],
            "updated_at": post["updated_at"]
        })
    return blogs

@router.post("/posts", response_model=BlogPostInDB)
async def create_blog_post(
    title: str = Form(...),
    excerpt: str = Form(...),
    content:str=Form(...),
    author: str = Form(...),
    read_time: str = Form(...),
    image: UploadFile = File(None),
    db=Depends(get_blog_db),
    misc_db=Depends(get_misc_db)
):
    now = datetime.utcnow()
    image_url = None
    if image:
        image_url = await save_uploaded_image(image, "blogs",'BLOGS')
    post_data = {
        "title": title,
        "excerpt": excerpt,
        "author": author,
        "content":content,
        "read_time": read_time,
        "image_url": image_url,
        "likes": 0,
        "created_at": now,
        "updated_at": now
    }
    result = await db.blogs.insert_one(post_data)
    new_post = await db.blogs.find_one({"_id": result.inserted_id})

    # Notify all subscribers
    # sender_email = os.getenv("ADMIN_EMAIL")
    # app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    # template_path = Path(__file__).parent.parent / "templates" / "blog_notification.html"
    # blog_id = str(new_post["_id"])
    # Get all subscribers
    # subscribers = misc_db.subscribers.find({})
    # async for subscriber in subscribers:
    #     receiver_email = subscriber["email"]
    #     if not template_path.exists():
    #         html_content = f"""
    #         <html>
    #         <body>
    #             <h2>New Blog Published!</h2>
    #             <p>Topic: {title}</p>
        #         <p>Description: {excerpt}</p>
        #         <a href='https://fdc-pucit.vercel.app/blogs/{blog_id}'>Read the Blog</a>
        #         <div style='margin-top:32px;font-size:0.9em;color:#888;'>
        #             &copy; {datetime.now().year} Taakra 2026. All rights reserved.
        #         </div>
        #     </body>
        #     </html>
        #     """
        # else:
        #     with open(template_path, 'r') as file:
        #         template_content = file.read()
        #     template = Template(template_content)
        #     html_content = template.render(
        #         email=receiver_email,
        #         topic=title,
        #         author=author,
        #         description=excerpt,
        #         blog_id=blog_id,
        #         year=datetime.now().year
        #     )
        # msg = MIMEMultipart("alternative")
        # msg["Subject"] = f"New Blog Published: {title} - Taakra 2026"
        # msg["From"] = sender_email
        # msg["To"] = receiver_email
        # text = f"New blog published: {title}\nDescription: {excerpt}\nRead: https://fdc-pucit.vercel.app/blogs/{blog_id}"
        # part1 = MIMEText(text, "plain")
        # part2 = MIMEText(html_content, "html")
        # msg.attach(part1)
        # msg.attach(part2)
        # try:
        #     with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        #         server.login(sender_email, app_password)
        #         # server.sendmail(sender_email, receiver_email, msg.as_string())
        #     print(f"Blog notification sent to {receiver_email}")
        # except Exception as e:
        #     print(f"Error sending blog notification to {receiver_email}: {e}")

    return {
        "id": str(new_post["_id"]),
        **post_data
    }

@router.get("/posts/{post_id}", response_model=BlogPostInDB)
async def get_blog_post(post_id: str, db=Depends(get_blog_db)):
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "id": str(post["_id"]),
        "title": post["title"],
        "excerpt": post["excerpt"],
        "author": post["author"],
        "content":post["content"],
        "read_time": post["read_time"],
        "image_url": post.get("image_url"),
        "likes": post.get("likes", 0),
        "created_at": post["created_at"],
        "updated_at": post["updated_at"]
    }

@router.put("/posts/{post_id}", response_model=BlogPostInDB)
async def update_blog_post(
    post_id: str,
    title: str = Form(...),
    excerpt: str = Form(...),
    content:str=Form(...),
    author: str = Form(...),
    read_time: str = Form(...),
    image: UploadFile = File(None),
    db=Depends(get_blog_db)
):
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    now = datetime.utcnow()
    update_data = {
        "title": title,
        "excerpt": excerpt,
        "content": content,
        "author": author,
        "read_time": read_time,
        "updated_at": now
    }
    
    if image:
        update_data["image_url"] = await save_uploaded_image(image, "blogs", "BLOGS")

    await db.blogs.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": update_data}
    )
    
    updated_post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    return {
        "id": str(updated_post["_id"]),
        "title": updated_post["title"],
        "excerpt": updated_post["excerpt"],
        "content": updated_post["content"],
        "author": updated_post["author"],
        "read_time": updated_post["read_time"],
        "image_url": updated_post.get("image_url"),
        "likes": updated_post.get("likes", 0),
        "created_at": updated_post["created_at"],
        "updated_at": updated_post["updated_at"]
    }

@router.delete("/posts/{post_id}")
async def delete_blog_post(post_id: str, db=Depends(get_blog_db)):
    result = await db.blogs.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}


@router.post('/posts/{post_id}/comments')
async def add_comment(
    post_id: str, 
    name: str = Form(...), 
    email: str = Form(...), 
    body: str = Form(...),
    verification_token: Optional[str] = Form(None),
    db=Depends(get_blog_db),
    misc_db=Depends(get_misc_db)
):
    """
    Add a comment to a blog post. Requires email verification.
    verification_token should be a temporary token obtained after OTP verification.
    """
    # Ensure post exists
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Check if email is verified
    if not verification_token:
        raise HTTPException(status_code=400, detail='Email verification required. Please verify your email first.')
    
    # Verify the token (check if email was verified recently)
    verification_record = await misc_db.blog_comment_verifications.find_one({
        "email": email,
        "token": verification_token,
        "verified": True
    })
    
    if not verification_record:
        raise HTTPException(status_code=400, detail='Invalid or expired verification token. Please verify your email again.')
    
    # Check if verification is still valid (within 10 minutes)
    time_diff = (datetime.utcnow() - verification_record["verified_at"]).total_seconds()
    if time_diff > 600:  # 10 minutes
        raise HTTPException(status_code=400, detail='Verification expired. Please verify your email again.')
    
    now = datetime.utcnow()
    comment = {
        'post_id': post_id,
        'name': name,
        'email': email,
        'body': body,
        'created_at': now,
        'verified': True,  # Mark as verified
        'approved': False  # Comments require admin approval
    }
    result = await db.blog_comments.insert_one(comment)
    
    # Clean up verification record after successful comment
    await misc_db.blog_comment_verifications.delete_one({"_id": verification_record["_id"]})
    
    # Fetch the inserted comment and convert ObjectId to string
    inserted_comment = await db.blog_comments.find_one({"_id": result.inserted_id})
    if inserted_comment:
        inserted_comment["id"] = str(inserted_comment["_id"])
        del inserted_comment["_id"]  # Remove ObjectId
    
    # Send email notification to admins
    try:
        await send_comment_notification_email(
            post_title=post.get("title", "Unknown Post"),
            commenter_name=name,
            commenter_email=email,
            comment_body=body,
            post_id=post_id,
            timestamp=now.strftime('%Y-%m-%d %H:%M:%S UTC')
        )
    except Exception as e:
        print(f"Error sending comment notification email: {e}")
        # Don't fail the comment creation if email fails
    
    return {'status': 'ok', 'comment': inserted_comment}


@router.post('/posts/{post_id}/comments/verify-email')
async def verify_email_for_comment(
    post_id: str,
    email: str = Form(...),
    otp: int = Form(...),
    db=Depends(get_blog_db),
    misc_db=Depends(get_misc_db)
):
    """
    Verify email with OTP for blog comment submission.
    Returns a verification token that must be used when submitting the comment.
    """
    # Ensure post exists
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Verify OTP
    stored_otp = await misc_db["otps"].find_one({"email": email})
    if not stored_otp or stored_otp["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if OTP is expired (5 minutes)
    time_diff = (datetime.utcnow() - stored_otp["created_at"]).total_seconds()
    if time_diff > 300:
        await misc_db["otps"].delete_one({"email": email})
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Delete used OTP
    await misc_db["otps"].delete_one({"email": email})
    
    # Generate verification token
    import uuid
    verification_token = str(uuid.uuid4())
    
    # Store verification record
    await misc_db.blog_comment_verifications.insert_one({
        "email": email,
        "token": verification_token,
        "post_id": post_id,
        "verified": True,
        "verified_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })
    
    return {
        "verified": True,
        "verification_token": verification_token,
        "message": "Email verified successfully"
    }


@router.get('/posts/{post_id}/comments')
async def list_comments(post_id: str, db=Depends(get_blog_db)):
    """List comments for a blog post. Only returns approved comments for public access."""
    comments = []
    async for c in db.blog_comments.find({
        'post_id': post_id,
        'approved': True  # Only show approved comments
    }).sort('created_at', -1):
        # Convert ObjectId to string and remove _id field
        c['id'] = str(c.get('_id'))
        if '_id' in c:
            del c['_id']
        comments.append(c)
    return comments




@router.post('/posts/{post_id}/like')
async def like_post(post_id: str, request: Request, db=Depends(get_blog_db), misc_db=Depends(get_misc_db)):
    """Like a blog post. Increments the like count. One like per user/IP."""
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Get user identifier (IP address + user agent for better tracking)
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")[:100]  # Limit length
    identifier = f"{ip_address}:{user_agent}"
    
    # Check if user has already liked this post
    existing_like = await misc_db.blog_likes.find_one({
        'post_id': post_id,
        'identifier': identifier
    })
    
    if existing_like:
        raise HTTPException(status_code=400, detail='You have already liked this post')
    
    # Record the like
    await misc_db.blog_likes.insert_one({
        'post_id': post_id,
        'identifier': identifier,
        'ip_address': ip_address,
        'created_at': datetime.utcnow()
    })
    
    # Increment likes
    await db.blogs.update_one({'_id': ObjectId(post_id)}, {'$inc': {'likes': 1}})
    updated = await db.blogs.find_one({'_id': ObjectId(post_id)})
    return {'likes': updated.get('likes', 0), 'liked': True}


@router.get('/posts/{post_id}/like/status')
async def get_like_status(post_id: str, request: Request, db=Depends(get_blog_db), misc_db=Depends(get_misc_db)):
    """Check if the current user has liked this post."""
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Get user identifier
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")[:100]
    identifier = f"{ip_address}:{user_agent}"
    
    # Check if user has liked
    existing_like = await misc_db.blog_likes.find_one({
        'post_id': post_id,
        'identifier': identifier
    })
    
    return {'liked': existing_like is not None, 'likes': post.get('likes', 0)}


# Blog Submission Endpoints
@router.get("/submissions/otp/generate")
async def generate_blog_submission_otp(
    email: str,
    request: Request,
    misc_db=Depends(get_misc_db)
):
    """Generate OTP for blog submission email verification."""
    import random
    from backend.middleware.auth.otp import send_otp_email
    
    otp = random.randint(100000, 999999)
    
    # Remove any previous OTPs for this email
    await misc_db["otps"].delete_many({"email": email})
    
    # Store OTP in the database with the user's email
    await misc_db["otps"].insert_one({
        "email": email, 
        "otp": otp, 
        "created_at": datetime.utcnow()
    })
    
    # Get client IP address and device info
    ip_address = request.client.host if request.client else "unknown"
    user_agent_str = request.headers.get("user-agent", "")
    try:
        import user_agents
        user_agent = user_agents.parse(user_agent_str)
        device_info = f"{user_agent.browser.family} on {user_agent.os.family}"
    except:
        device_info = user_agent_str[:50] if user_agent_str else "unknown"
    
    # Send OTP email with blog_submission template type
    await send_otp_email(str(otp), email, ip_address, device_info, template_type="blog_submission")
    
    return {"message": "OTP generated and sent successfully"}


@router.post("/submissions/verify-email")
async def verify_email_for_blog_submission(
    email: str = Form(...),
    otp: int = Form(...),
    misc_db=Depends(get_misc_db)
):
    """
    Verify email with OTP for blog submission.
    Returns a verification token that must be used when submitting the blog.
    """
    # Verify OTP
    stored_otp = await misc_db["otps"].find_one({"email": email})
    if not stored_otp or stored_otp["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if OTP is expired (5 minutes)
    time_diff = (datetime.utcnow() - stored_otp["created_at"]).total_seconds()
    if time_diff > 300:
        await misc_db["otps"].delete_one({"email": email})
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Delete used OTP
    await misc_db["otps"].delete_one({"email": email})
    
    # Generate verification token
    import uuid
    verification_token = str(uuid.uuid4())
    
    # Store verification record
    await misc_db.blog_submission_verifications.insert_one({
        "email": email,
        "token": verification_token,
        "verified": True,
        "verified_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=30)
    })
    
    return {
        "verified": True,
        "verification_token": verification_token,
        "message": "Email verified successfully"
    }


@router.post("/submissions")
async def submit_blog(
    title: str = Form(...),
    excerpt: str = Form(...),
    content: str = Form(...),
    author: str = Form(...),
    read_time: str = Form(...),
    email: str = Form(...),
    verification_token: str = Form(...),
    image: UploadFile = File(None),
    db=Depends(get_blog_db),
    misc_db=Depends(get_misc_db)
):
    """Submit a blog post for review. Requires email verification."""
    # Check if blog submissions are open
    settings = await misc_db.settings.find_one({'_id': 'blog_submissions'})
    if settings and not settings.get('open', True):
        raise HTTPException(status_code=403, detail="Blog submissions are currently closed")
    
    # Verify the verification token
    verification = await misc_db.blog_submission_verifications.find_one({
        "email": email,
        "token": verification_token,
        "verified": True
    })
    
    if not verification:
        raise HTTPException(status_code=400, detail="Email verification required. Please verify your email first.")
    
    # Check if token is expired
    if datetime.utcnow() > verification["expires_at"]:
        raise HTTPException(status_code=400, detail="Verification token expired. Please verify your email again.")
    
    now = datetime.utcnow()
    image_url = None
    if image:
        image_url = await save_uploaded_image(image, "blogs", 'BLOGS')
    
    submission_data = {
        "title": title,
        "excerpt": excerpt,
        "author": author,
        "content": content,
        "read_time": read_time,
        "image_url": image_url,
        "email": email,
        "status": "pending",
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.blog_submissions.insert_one(submission_data)
    submission = await db.blog_submissions.find_one({"_id": result.inserted_id})
    
    # Delete the verification token after successful submission
    await misc_db.blog_submission_verifications.delete_one({"token": verification_token})
    
    return {
        "id": str(submission["_id"]),
        "title": submission["title"],
        "status": submission["status"],
        "message": "Blog submission received. It will be reviewed by our team."
    }


@router.get("/submissions")
async def get_blog_submissions(
    status: Optional[str] = None,
    db=Depends(get_blog_db)
):
    """Get blog submissions. Filter by status if provided."""
    query = {}
    if status:
        query["status"] = status
    
    submissions = []
    async for submission in db.blog_submissions.find(query).sort("created_at", -1):
        submissions.append({
            "id": str(submission["_id"]),
            "title": submission["title"],
            "excerpt": submission["excerpt"],
            "author": submission["author"],
            "read_time": submission["read_time"],
            "content": submission["content"],
            "image_url": submission.get("image_url"),
            "email": submission.get("email"),
            "status": submission["status"],
            "created_at": submission["created_at"],
            "updated_at": submission["updated_at"]
        })
    return submissions


@router.put("/submissions/{submission_id}/approve")
async def approve_blog_submission(
    submission_id: str,
    db=Depends(get_blog_db),
    misc_db=Depends(get_misc_db)
):
    """Approve a blog submission and create it as a published blog post."""
    submission = await db.blog_submissions.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Submission is already {submission['status']}")
    
    now = datetime.utcnow()
    # Create the blog post
    post_data = {
        "title": submission["title"],
        "excerpt": submission["excerpt"],
        "author": submission["author"],
        "content": submission["content"],
        "read_time": submission["read_time"],
        "image_url": submission.get("image_url"),
        "likes": 0,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.blogs.insert_one(post_data)
    new_post = await db.blogs.find_one({"_id": result.inserted_id})
    
    # Update submission status
    await db.blog_submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"status": "approved", "updated_at": now, "published_post_id": str(new_post["_id"])}}
    )
    
    # Notify all subscribers
    sender_email = os.getenv("ADMIN_EMAIL")
    app_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    template_path = Path(__file__).parent.parent / "templates" / "blog_notification.html"
    blog_id = str(new_post["_id"])
    
    subscribers = misc_db.subscribers.find({})
    async for subscriber in subscribers:
        receiver_email = subscriber["email"]
        if not template_path.exists():
            html_content = f"""
            <html>
            <body>
                <h2>New Blog Published!</h2>
                <p>Topic: {submission['title']}</p>
                <p>Description: {submission['excerpt']}</p>
                <a href='https://fdc-pucit.vercel.app/blogs/{blog_id}'>Read the Blog</a>
                <div style='margin-top:32px;font-size:0.9em;color:#888;'>
                    &copy; {datetime.now().year} Taakra 2026. All rights reserved.
                </div>
            </body>
            </html>
            """
        else:
            with open(template_path, 'r') as file:
                template_content = file.read()
            template = Template(template_content)
            html_content = template.render(
                email=receiver_email,
                topic=submission['title'],
                author=submission['author'],
                description=submission['excerpt'],
                blog_id=blog_id,
                year=datetime.now().year
            )
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"New Blog Published: {submission['title']} - Taakra 2026"
        msg["From"] = sender_email
        msg["To"] = receiver_email
        text = f"New blog published: {submission['title']}\nDescription: {submission['excerpt']}\nRead: https://fdc-pucit.vercel.app/blogs/{blog_id}"
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, app_password)
                server.sendmail(sender_email, receiver_email, msg.as_string())
            print(f"Blog notification sent to {receiver_email}")
        except Exception as e:
            print(f"Error sending blog notification to {receiver_email}: {e}")
    
    return {
        "id": str(new_post["_id"]),
        "title": new_post["title"],
        "status": "approved",
        "message": "Blog submission approved and published"
    }


@router.put("/submissions/{submission_id}/reject")
async def reject_blog_submission(
    submission_id: str,
    reason: Optional[str] = Form(None),
    db=Depends(get_blog_db)
):
    """Reject a blog submission."""
    submission = await db.blog_submissions.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Submission is already {submission['status']}")
    
    now = datetime.utcnow()
    await db.blog_submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"status": "rejected", "rejection_reason": reason, "updated_at": now}}
    )
    
    return {
        "id": str(submission["_id"]),
        "status": "rejected",
        "message": "Blog submission rejected"
    }


@router.delete("/submissions/{submission_id}")
async def delete_blog_submission(
    submission_id: str,
    db=Depends(get_blog_db)
):
    """Delete a blog submission."""
    result = await db.blog_submissions.delete_one({"_id": ObjectId(submission_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission deleted successfully"}


# Blog submission registration status endpoints
@router.get("/submissions/status")
async def get_blog_submission_status(misc_db=Depends(get_misc_db)):
    """Get blog submission registration status (public endpoint)."""
    settings = await misc_db.settings.find_one({'_id': 'blog_submissions'})
    if not settings:
        return {'open': True}  # Default to open
    return {'open': bool(settings.get('open', True))}
