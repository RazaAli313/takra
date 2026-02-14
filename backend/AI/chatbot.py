import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import uuid

load_dotenv()

logger = logging.getLogger(__name__)

class RAGChatbot:
    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        qdrant_url: str = "http://localhost:6333",
        collection_name: str = "takra_pdfs",
        data_folder: str = "data",
        embedding_model_name: str = "all-MiniLM-L6-v2"
    ):
        """
        Initialize RAG Chatbot with Gemini and Qdrant
        
        Args:
            gemini_api_key: Google Gemini API key (defaults to GEMINI_API_KEY env var)
            qdrant_url: Qdrant server URL
            collection_name: Name of the Qdrant collection
            data_folder: Path to folder containing PDFs
            embedding_model_name: Name of the sentence transformer model for embeddings
        """
        # Get Gemini API key
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found. Please set it in environment variables or pass it as parameter.")
        
        # Initialize Gemini for text generation
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Initialize embedding model (sentence-transformers for reliable embeddings)
        logger.info(f"Loading embedding model: {embedding_model_name}")
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.embedding_dimension = self.embedding_model.get_sentence_embedding_dimension()
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(url=qdrant_url)
        self.collection_name = collection_name
        
        # Data folder path - resolve relative to this file's directory
        data_path = Path(data_folder)
        if not data_path.is_absolute():
            # If relative, resolve relative to the chatbot.py file location
            current_file = Path(__file__).parent
            # Remove "takra/backend/AI/" prefix if present, otherwise use as-is
            if "data" in data_folder:
                data_path = current_file / "data"
            else:
                data_path = current_file / data_folder
        
        self.data_folder = data_path.resolve()
        if not self.data_folder.exists():
            raise ValueError(f"Data folder not found: {self.data_folder}")
        
        # Initialize collection if it doesn't exist
        self._initialize_collection()
        
        logger.info(f"RAG Chatbot initialized with collection: {collection_name}")
    
    def _initialize_collection(self):
        """Initialize Qdrant collection if it doesn't exist"""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if self.collection_name not in collection_names:
                # Create collection with embedding dimension
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created new collection: {self.collection_name} with dimension {self.embedding_dimension}")
            else:
                logger.info(f"Collection {self.collection_name} already exists")
        except Exception as e:
            logger.error(f"Error initializing collection: {e}")
            raise
    
    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using sentence-transformers"""
        try:
            embedding = self.embedding_model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            raise
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """Split text into chunks with overlap"""
        chunks = []
        words = text.split()
        
        for i in range(0, len(words), chunk_size - chunk_overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    def _extract_text_from_pdf(self, pdf_path: Path) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(str(pdf_path))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF {pdf_path}: {e}")
            raise
    
    def process_pdfs(self, force_reload: bool = False) -> Dict[str, Any]:
        """
        Process all PDFs in the data folder and store in Qdrant
        
        Args:
            force_reload: If True, reprocess all PDFs even if already indexed
        
        Returns:
            Dictionary with processing results
        """
        pdf_files = list(self.data_folder.glob("*.pdf"))
        
        if not pdf_files:
            logger.warning(f"No PDF files found in {self.data_folder}")
            return {"message": "No PDF files found", "processed": 0}
        
        processed_count = 0
        total_chunks = 0
        
        for pdf_path in pdf_files:
            try:
                logger.info(f"Processing PDF: {pdf_path.name}")
                
                # Extract text from PDF
                text = self._extract_text_from_pdf(pdf_path)
                
                if not text.strip():
                    logger.warning(f"No text extracted from {pdf_path.name}")
                    continue
                
                # Chunk the text
                chunks = self._chunk_text(text)
                logger.info(f"Created {len(chunks)} chunks from {pdf_path.name}")
                
                # Generate embeddings and store in Qdrant
                points = []
                for idx, chunk in enumerate(chunks):
                    try:
                        embedding = self._get_embedding(chunk)
                        point_id = str(uuid.uuid4())
                        
                        points.append(
                            PointStruct(
                                id=point_id,
                                vector=embedding,
                                payload={
                                    "text": chunk,
                                    "source": pdf_path.name,
                                    "chunk_index": idx,
                                    "total_chunks": len(chunks)
                                }
                            )
                        )
                    except Exception as e:
                        logger.error(f"Error processing chunk {idx} from {pdf_path.name}: {e}")
                        continue
                
                # Upsert points to Qdrant
                if points:
                    self.qdrant_client.upsert(
                        collection_name=self.collection_name,
                        points=points
                    )
                    processed_count += 1
                    total_chunks += len(points)
                    logger.info(f"Stored {len(points)} chunks from {pdf_path.name} in Qdrant")
                
            except Exception as e:
                logger.error(f"Error processing PDF {pdf_path.name}: {e}")
                continue
        
        return {
            "message": "PDFs processed successfully",
            "processed_files": processed_count,
            "total_chunks": total_chunks
        }
    
    def _search_relevant_chunks(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant chunks in Qdrant"""
        try:
            # Get query embedding
            query_embedding = self._get_embedding(query)
            
            # Search in Qdrant
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=top_k
            )
            
            # Format results
            chunks = []
            for result in search_results:
                chunks.append({
                    "text": result.payload.get("text", ""),
                    "source": result.payload.get("source", ""),
                    "score": result.score
                })
            
            return chunks
        except Exception as e:
            logger.error(f"Error searching chunks: {e}")
            raise
    
    def chat(self, user_query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Chat with the RAG system
        
        Args:
            user_query: User's question
            top_k: Number of relevant chunks to retrieve
        
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Search for relevant chunks
            relevant_chunks = self._search_relevant_chunks(user_query, top_k)
            
            if not relevant_chunks:
                return {
                    "response": "I couldn't find relevant information in the documents. Please try rephrasing your question.",
                    "sources": [],
                    "chunks_used": 0
                }
            
            # Build context from chunks
            context = "\n\n".join([
                f"[Source: {chunk['source']}]\n{chunk['text']}"
                for chunk in relevant_chunks
            ])
            
            # Create prompt with context
            prompt = f"""You are a helpful assistant that answers questions based on the provided context from PDF documents.

Context from documents:
{context}

User Question: {user_query}

Please provide a clear and accurate answer based on the context above. If the context doesn't contain enough information to answer the question, say so. Cite the source when possible.

Answer:"""
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            answer = response.text if hasattr(response, 'text') else str(response)
            
            # Extract sources
            sources = list(set([chunk['source'] for chunk in relevant_chunks]))
            
            return {
                "response": answer,
                "sources": sources,
                "chunks_used": len(relevant_chunks),
                "relevant_chunks": relevant_chunks
            }
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return {
                "response": f"Sorry, I encountered an error: {str(e)}",
                "sources": [],
                "chunks_used": 0,
                "error": str(e)
            }
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the Qdrant collection"""
        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            return {
                "collection_name": self.collection_name,
                "points_count": collection_info.points_count,
                "vectors_count": collection_info.vectors_count,
                "status": collection_info.status
            }
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            return {"error": str(e)}


# Global chatbot instance (lazy initialization)
_chatbot_instance: Optional[RAGChatbot] = None

def get_chatbot() -> RAGChatbot:
    """Get or create chatbot instance"""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = RAGChatbot()
    return _chatbot_instance
