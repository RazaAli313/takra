from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from backend.config.database.init import get_blog_db
from backend.middleware.auth.token import verify_token

router = APIRouter()


@router.get('/posts/{post_id}/comments/all')
async def list_all_comments(post_id: str, db=Depends(get_blog_db), auth=Depends(verify_token)):
    """List all comments (including unapproved) for admin. Requires authentication."""
    comments = []
    async for c in db.blog_comments.find({'post_id': post_id}).sort('created_at', -1):
        # Convert ObjectId to string and remove _id field
        c['id'] = str(c.get('_id'))
        if '_id' in c:
            del c['_id']
        comments.append(c)
    return comments


@router.put('/posts/{post_id}/comments/{comment_id}/approve')
async def approve_comment(
    post_id: str,
    comment_id: str,
    db=Depends(get_blog_db),
    auth=Depends(verify_token)
):
    """Approve a comment. Requires admin authentication."""
    # Verify post exists
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Update comment
    result = await db.blog_comments.update_one(
        {'_id': ObjectId(comment_id), 'post_id': post_id},
        {'$set': {'approved': True, 'approved_at': datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Comment not found')
    
    return {'status': 'ok', 'message': 'Comment approved'}


@router.put('/posts/{post_id}/comments/{comment_id}/reject')
async def reject_comment(
    post_id: str,
    comment_id: str,
    db=Depends(get_blog_db),
    auth=Depends(verify_token)
):
    """Reject/delete a comment. Requires admin authentication."""
    # Verify post exists
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Delete comment
    result = await db.blog_comments.delete_one({
        '_id': ObjectId(comment_id),
        'post_id': post_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Comment not found')
    
    return {'status': 'ok', 'message': 'Comment rejected and deleted'}


@router.delete('/posts/{post_id}/comments/{comment_id}')
async def delete_comment(
    post_id: str,
    comment_id: str,
    db=Depends(get_blog_db),
    auth=Depends(verify_token)
):
    """Delete a comment (even if approved). Requires admin authentication."""
    # Verify post exists
    post = await db.blogs.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    # Delete comment
    result = await db.blog_comments.delete_one({
        '_id': ObjectId(comment_id),
        'post_id': post_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Comment not found')
    
    return {'status': 'ok', 'message': 'Comment deleted'}

