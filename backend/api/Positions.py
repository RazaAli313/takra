from fastapi import APIRouter, HTTPException, Depends, Body, Query
from pydantic import BaseModel
from typing import List
from bson import ObjectId
from backend.config.database.init import get_misc_db
from backend.middleware.auth.token import verify_token
from datetime import datetime

router = APIRouter()


class PositionIn(BaseModel):
    name: str


@router.get('/positions')
async def list_positions(db=Depends(get_misc_db)):
    docs = []
    cursor = db.positions.find({}).sort('created_at', -1)
    async for d in cursor:
        docs.append({'id': str(d.get('_id')), 'name': d.get('name')})
    return {'positions': docs}


@router.get('/admin/positions')
async def admin_list_positions(db=Depends(get_misc_db), auth=Depends(verify_token)):
    docs = []
    cursor = db.positions.find({}).sort('created_at', -1)
    async for d in cursor:
        docs.append({'id': str(d.get('_id')), 'name': d.get('name')})
    return {'positions': docs}


@router.post('/admin/positions')
async def create_position(payload: PositionIn = Body(...), db=Depends(get_misc_db), auth=Depends(verify_token)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail='Position name required')
    now = datetime.utcnow()
    res = await db.positions.insert_one({'name': name, 'created_at': now, 'updated_at': now})
    return {'id': str(res.inserted_id), 'name': name}


@router.put('/admin/positions/{pos_id}')
async def update_position(pos_id: str, payload: PositionIn = Body(...), db=Depends(get_misc_db), auth=Depends(verify_token)):
    try:
        oid = ObjectId(pos_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail='Position name required')
    res = await db.positions.find_one_and_update({'_id': oid}, {'$set': {'name': name, 'updated_at': datetime.utcnow()}}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail='Position not found')
    return {'id': str(res.get('_id')), 'name': name}


@router.delete('/admin/positions/{pos_id}')
async def delete_position(pos_id: str, force: bool = Query(False), db=Depends(get_misc_db), auth=Depends(verify_token)):
    try:
        oid = ObjectId(pos_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid id')

    pos = await db.positions.find_one({'_id': oid})
    if not pos:
        raise HTTPException(status_code=404, detail='Position not found')

    pos_name = pos.get('name')
    # count registrations that reference this position name
    try:
        usage_count = await db.registrations.count_documents({'position_applied': pos_name})
    except Exception:
        usage_count = 0

    if usage_count > 0 and not force:
        # do not delete; return usage info so UI can warn and request confirmation
        return {'in_use': True, 'count': usage_count}

    res = await db.positions.delete_one({'_id': oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=500, detail='Failed to delete')
    return {'deleted': True, 'deleted_count': res.deleted_count, 'previous_usage_count': usage_count}
