import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()

def get_misc_db():
    if miscDB is None:
        raise RuntimeError("❌ miscDB not initialized")
    return miscDB

def get_blog_db():
    if blogDB is None:
        raise RuntimeError("❌ blogDB not initialized")
    return blogDB

def get_event_db():
    if eventDB is None:
        raise RuntimeError("❌ eventDB not initialized")
    return eventDB

# MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")

# MongoDB configuration
BLOGS_MONGO_DB_URI = os.getenv("BLOGS_MONGO_DB_URI")
BLOGS_MONGO_DB_NAME = os.getenv("BLOGS_MONGO_DB_NAME")

EVENTS_MONGO_DB_URI = os.getenv("EVENTS_MONGO_DB_URI")
EVENTS_MONGO_DB_NAME = os.getenv("EVENTS_MONGO_DB_NAME")

MISC_MONGO_DB_URI = os.getenv("MISC_MONGO_DB_URI")
MISC_MONGO_DB_NAME = os.getenv("MISC_MONGO_DB_NAME")


# BLOGS_MONGO_DB_URI = os.getenv("BLOGS_MONGO_URI")
# BLOGS_MONGO_DB_NAME = os.getenv("BLOGS_MONGODB_NAME")

# EVENTS_MONGO_DB_URI = os.getenv("EVENTS_MONGO_URI")
# EVENTS_MONGO_DB_NAME = os.getenv("EVENTS_MONGODB_NAME")

# MISC_MONGO_DB_URI = os.getenv("MISC_MONGO_URI")
# MISC_MONGO_DB_NAME = os.getenv("MISC_MONGODB_NAME")

DEFAULT_DB_URI = os.getenv("DEFAULT_MONGO_URI",)
DEFAULT_DB_NAME = os.getenv("DEFAULT_MONGODB_NAME")

if not BLOGS_MONGO_DB_URI or not BLOGS_MONGO_DB_NAME:
    raise ValueError("Blog MongoDB configuration is missing.")
if not EVENTS_MONGO_DB_URI or not EVENTS_MONGO_DB_NAME:   
    raise ValueError("Event MongoDB configuration is missing.") 
if not MISC_MONGO_DB_URI or not MISC_MONGO_DB_NAME:
    raise ValueError("Misc MongoDB configuration is missing.")
     


# def get_mongo_config(db_type: str = "blog"):
    
    # if db_type == "blog":
    #     return BLOGS_MONGO_DB_URI, BLOGS_MONGO_DB_NAME
    # elif db_type == "event":
    #     return EVENTS_MONGO_DB_URI, EVENTS_MONGO_DB_NAME
    # elif db_type == "misc": 
    #     return MISC_MONGO_DB_URI, MISC_MONGO_DB_NAME
  
    # return DEFAULT_DB_URI, DEFAULT_DB_NAME
        # raise ValueError("Invalid db_type. Choose from 'blog', 'event', or 'misc'.")    
    

blogDB = None
eventDB = None
miscDB = None

async def  init_db():
    """Initialize all MongoDB connections once."""
    global blogDB, eventDB, miscDB
    print(BLOGS_MONGO_DB_URI)
    print(BLOGS_MONGO_DB_NAME)
    print(EVENTS_MONGO_DB_URI)
    print(EVENTS_MONGO_DB_NAME)
    print(MISC_MONGO_DB_URI)
    print(MISC_MONGO_DB_NAME)

    blog_client = AsyncIOMotorClient(BLOGS_MONGO_DB_URI)
    blogDB = blog_client[BLOGS_MONGO_DB_NAME]

    event_client = AsyncIOMotorClient(EVENTS_MONGO_DB_URI)
    eventDB = event_client[EVENTS_MONGO_DB_NAME]

    misc_client = AsyncIOMotorClient(MISC_MONGO_DB_URI)
    miscDB = misc_client[MISC_MONGO_DB_NAME]
    print(blogDB)
    print(eventDB)
    print(miscDB)

    print("✅ MongoDB connections initialized")




