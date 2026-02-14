"""
Admin initialization script for Taakra.
Creates or updates the default admin user.
Run from project root: python backend/scripts/init_admin.py
Or from backend: python scripts/init_admin.py (adjust load_dotenv path below)
"""
import os
import sys

# Add project root and backend to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
backend_dir = os.path.join(project_root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
# Load .env from backend folder (if script is in backend/scripts/)
load_dotenv(os.path.join(project_root, "backend", ".env"))
load_dotenv(os.path.join(project_root, ".env"))

from passlib.context import CryptContext
from pymongo import MongoClient

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "razaalipk313@gmail.com"
ADMIN_PASSWORD = "takra2026"

def main():
    uri = os.getenv("MISC_MONGO_DB_URI")
    db_name = os.getenv("MISC_MONGO_DB_NAME")
    if not uri or not db_name:
        print("ERROR: Set MISC_MONGO_DB_URI and MISC_MONGO_DB_NAME in .env")
        sys.exit(1)

    client = MongoClient(uri)
    db = client[db_name]
    hashed = pwd_context.hash(ADMIN_PASSWORD)

    admin_doc = {
        "email": ADMIN_EMAIL,
        "username": ADMIN_EMAIL,
        "password": hashed,
    }

    result = db["admin"].update_one(
        {"$or": [{"email": ADMIN_EMAIL}, {"username": ADMIN_EMAIL}]},
        {"$set": admin_doc},
        upsert=True,
    )

    if result.upserted_id:
        print("Admin created successfully.")
    else:
        print("Admin updated successfully.")
    print("Login with email:", ADMIN_EMAIL, "and your password.")

if __name__ == "__main__":
    main()