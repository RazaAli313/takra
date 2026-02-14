from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from backend.AI.chatbot import get_chatbot, RAGChatbot

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    chunks_used: int
    relevant_chunks: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


@router.post("/chatbot/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the RAG chatbot
    
    Args:
        request: ChatRequest with user query and optional top_k parameter
    
    Returns:
        ChatResponse with answer, sources, and metadata
    """
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty"
            )
        
        chatbot = get_chatbot()
        result = chatbot.chat(request.query.strip(), top_k=request.top_k or 5)
        
        return ChatResponse(**result)
    
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot configuration error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.post("/chatbot/process-pdfs")
async def process_pdfs(force_reload: bool = False):
    """
    Process all PDFs in the data folder and index them in Qdrant
    
    Args:
        force_reload: If True, reprocess all PDFs even if already indexed
    
    Returns:
        Dictionary with processing results
    """
    try:
        chatbot = get_chatbot()
        result = chatbot.process_pdfs(force_reload=force_reload)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=result
        )
    
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot configuration error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error processing PDFs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing PDFs: {str(e)}"
        )


@router.get("/chatbot/collection-info")
async def get_collection_info():
    """
    Get information about the Qdrant collection
    
    Returns:
        Dictionary with collection statistics
    """
    try:
        chatbot = get_chatbot()
        info = chatbot.get_collection_info()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=info
        )
    
    except Exception as e:
        logger.error(f"Error getting collection info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting collection info: {str(e)}"
        )


@router.get("/chatbot/health")
async def health_check():
    """
    Health check endpoint for the chatbot service
    
    Returns:
        Dictionary with service status
    """
    try:
        chatbot = get_chatbot()
        collection_info = chatbot.get_collection_info()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "healthy",
                "collection_info": collection_info
            }
        )
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )
