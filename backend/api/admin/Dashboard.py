from fastapi import APIRouter
from config.database.init import __init__
db=__init__()


router=APIRouter()


@router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_members = await db.members.count_documents({})
    upcoming_events = await db.events.count_documents({})
    blog_posts = await db.blog_posts.count_documents({})
    new_messages = await db.contact_messages.count_documents({})
    
    return {
        "total_members": total_members,
        "upcoming_events": upcoming_events,
        "blog_posts": blog_posts,
        "new_messages": new_messages,
        "member_change": "+5 from last month",  # Placeholder
        "events_change": "1 new this week",     # Placeholder
        "blog_change": "1 draft in progress",   # Placeholder
        "messages_change": "2 unread"           # Placeholder
    }

@router.get("/dashboard/activity")
async def get_recent_activity():
    # Example data - in a real app you would query actual activity logs
    activities = [
        {
            "id": 1,
            "action": "Updated About page",
            "user": "Noor Fatima",
            "time": "2 hours ago",
            "icon": "edit"
        },
        {
            "id": 2,
            "action": "Added new event: Tech War",
            "user": "Shahzeb Ali",
            "time": "1 day ago",
            "icon": "calendar"
        },
        {
            "id": 3,
            "action": "Published blog post",
            "user": "Fiza Haider",
            "time": "2 days ago",
            "icon": "file"
        }
    ]