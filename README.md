# Taakra Web Application

Full-stack web application for **Taakra 2026** with authentication, competitions, and admin management.

## Features

### General users
- Browse **categories** and **competitions** (sort: Most Registrations, Trending, New)
- **Search and filter** by category and date
- **Competition detail** page: rules, deadlines, prizes
- **Calendar/agenda** view of competitions
- **Register** for competitions (via Events flow)
- **User dashboard**: view registered competitions by email

### Admin
- Add and manage **competitions** and **categories**
- View events by **registration count**; approve/reject registrations
- **Support members**: add with permission-based roles; invitation email; conditional sidebar/routes

### Technical
- **Auth**: JWT (admin login), Google OAuth (Join Team / registration)
- **RBAC**: Admin vs support members; protected routes and API endpoints
- **Database**: MongoDB (events, misc, blog DBs)
- **UI**: React + Vite, Tailwind; Taakra theme; mobile-responsive

## Tech stack

- **Backend**: Python 3, FastAPI, Motor (MongoDB), JWT, bcrypt
- **Frontend**: React 18, Vite, React Router, Tailwind CSS
- **Database**: MongoDB

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` in project root (or `backend/`) with at least:
```env
# MongoDB
EVENTS_MONGO_DB_URI=mongodb://...
EVENTS_MONGO_DB_NAME=taakra_events
MISC_MONGO_DB_URI=mongodb://...
MISC_MONGO_DB_NAME=taakra_misc
BLOGS_MONGO_DB_URI=mongodb://...
BLOGS_MONGO_DB_NAME=taakra_blogs

# Auth
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

# Email (Gmail App Password, etc.)
ADMIN_EMAIL=contact@taakra2026.com
ADMIN_EMAIL_PASSWORD=...
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# Optional
FRONTEND_BASE_URL=http://localhost:5173
GOOGLE_OAUTH_CLIENT_ID=...        # for Join Team Google sign-in
GOOGLE_RECAPTCHA_SECRET=...
```
Run:
```bash
uvicorn backend.server:app --reload --app-dir .
```
Backend: `http://localhost:8000`. API docs: **http://localhost:8000/docs**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173`

### Create first admin
```bash
cd backend
ADMIN_EMAIL=razaalipk313@gmail.com ADMIN_PASSWORD=takra2026 python init-admin.py
```
(Requires `MISC_MONGO_DB_URI` and `MISC_MONGO_DB_NAME` in env.)

## API documentation
- **Swagger UI**: `GET /docs` when backend is running
- **ReDoc**: `GET /redoc`

## Deployment
- Deploy **backend** (e.g. Railway, Render, Fly.io) with env vars set; ensure MongoDB is reachable.
- Deploy **frontend** (e.g. Vercel, Netlify); set `VITE_API_BASE` or equivalent to your API URL.
- Use **HTTPS** in production; keep `JWT_SECRET` and DB URIs in environment only.

## Hackathon checklist
See **[HACKATHON_CHECKLIST.md](./HACKATHON_CHECKLIST.md)** for a requirement-by-requirement mapping and gap notes for the Taakra hackathon rubric.
