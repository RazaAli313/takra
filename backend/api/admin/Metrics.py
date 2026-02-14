from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from backend.config.database.init import get_misc_db
from backend.middleware.auth.token import verify_token

router = APIRouter()


@router.get('/metrics')
async def get_admin_metrics(db=Depends(get_misc_db), auth=Depends(verify_token)):
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)

    # total registrations
    total_regs = await db.registrations.count_documents({})

    # registrations in last 7 days
    recent_cnt = await db.registrations.count_documents({'created_at': {'$gte': seven_days_ago}})

    # registrations without picture
    no_picture = await db.registrations.count_documents({'$or': [{'picture_url': {'$exists': False}}, {'picture_url': None}, {'picture_url': ''}]})

    # registrations by position (group)
    pipeline = [
        {'$group': {'_id': '$position_applied', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    ag = db.registrations.aggregate(pipeline)
    by_position = []
    async for doc in ag:
        name = doc['_id'] or 'Unspecified'
        by_position.append({'position': name, 'count': doc['count']})

    # total positions configured
    try:
        positions_count = await db.positions.count_documents({})
    except Exception:
        positions_count = 0

    # recent registrations (last 5)
    recent_regs = []
    cursor = db.registrations.find().sort('created_at', -1).limit(5)
    async for r in cursor:
        recent_regs.append({
            'id': str(r.get('_id')),
            'name': r.get('name'),
            'email': r.get('email'),
            'position_applied': r.get('position_applied'),
            'created_at': r.get('created_at').isoformat() if r.get('created_at') else None
        })

    # registrations per day for last 7 days (simple trend)
    days = []
    for i in range(7):
        d = now - timedelta(days=i)
        start = datetime(d.year, d.month, d.day)
        end = start + timedelta(days=1)
        count = await db.registrations.count_documents({'created_at': {'$gte': start, '$lt': end}})
        days.append({'date': start.isoformat(), 'count': count})

    return {
        'total_registrations': total_regs,
        'registrations_last_7_days': recent_cnt,
        'registrations_without_picture': no_picture,
        'positions_count': positions_count,
        'registrations_by_position': by_position,
        'recent_registrations': recent_regs,
        'daily_trend_last_7_days': list(reversed(days))  # oldest first
    }
