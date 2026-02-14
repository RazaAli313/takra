import os
import logging
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import uuid

load_dotenv()

logger = logging.getLogger(__name__)

class RAGChatbot:
    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        pinecone_api_key: Optional[str] = None,
        index_name: str = "takrapdfs",
        data_folder: str = "data",
        embedding_model_name: str = "all-MiniLM-L6-v2"
    ):
        """
        Initialize RAG Chatbot with Gemini and Pinecone
        
        Args:
            gemini_api_key: Google Gemini API key (defaults to GEMINI_API_KEY env var)
            pinecone_api_key: Pinecone API key (defaults to PINECONE_API_KEY env var)
            index_name: Name of the Pinecone index
            data_folder: Path to folder containing PDFs
            embedding_model_name: Name of the sentence transformer model for embeddings
        """
        # Get Gemini API key
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found. Please set it in environment variables or pass it as parameter.")
        
        # Initialize Gemini for text generation
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Initialize embedding model (sentence-transformers for reliable embeddings)
        logger.info(f"Loading embedding model: {embedding_model_name}")
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.embedding_dimension = self.embedding_model.get_sentence_embedding_dimension()
        
        # Initialize Pinecone client
        self.pinecone_api_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")
        if not self.pinecone_api_key:
            raise ValueError("PINECONE_API_KEY not found. Please set it in environment variables or pass it as parameter.")
        
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index_name = index_name
        self.index = None  # Will be initialized on first use
        
        # Data folder path - resolve relative to this file's directory
        data_path = Path(data_folder)
        if not data_path.is_absolute():
            # If relative, resolve relative to the chatbot.py file location
            current_file = Path(__file__).parent
            if "data" in data_folder:
                data_path = current_file / "data"
            else:
                data_path = current_file / data_folder
        
        self.data_folder = data_path.resolve()
        if not self.data_folder.exists():
            raise ValueError(f"Data folder not found: {self.data_folder}")
        
        logger.info(f"RAG Chatbot initialized with Pinecone index: {index_name}")
    
    def _ensure_index_connected(self):
        """Ensure Pinecone index is connected, create if needed"""
        if self.index is not None:
            try:
                # Test connection by describing the index
                self.index.describe_index_stats()
                return True
            except Exception as e:
                logger.warning(f"Pinecone index connection lost, attempting to reconnect: {e}")
                self.index = None
        
        # Initialize or connect to Pinecone index
        try:
            # Check if index exists
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                # Create index if it doesn't exist
                logger.info(f"Creating Pinecone index: {self.index_name} with dimension {self.embedding_dimension}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.embedding_dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"  # You can change this to your preferred region
                    )
                )
                logger.info(f"Created new Pinecone index: {self.index_name}. Waiting for index to be ready...")
                # Wait for index to be ready (Pinecone serverless indexes can take a moment)
                max_wait = 60  # Maximum wait time in seconds
                wait_time = 0
                while wait_time < max_wait:
                    try:
                        # Check if index is ready by trying to connect
                        temp_index = self.pc.Index(self.index_name)
                        temp_index.describe_index_stats()  # This will fail if index isn't ready
                        logger.info("Index is ready!")
                        break
                    except Exception:
                        time.sleep(2)
                        wait_time += 2
                if wait_time >= max_wait:
                    logger.warning(f"Index creation may still be in progress. Continuing anyway...")
            else:
                logger.info(f"Pinecone index {self.index_name} already exists")
                # Check if the existing index has the correct dimension
                try:
                    index_info = self.pc.describe_index(self.index_name)
                    existing_dimension = index_info.dimension
                    if existing_dimension != self.embedding_dimension:
                        logger.warning(
                            f"Dimension mismatch detected! Index '{self.index_name}' has dimension {existing_dimension}, "
                            f"but embedding model produces {self.embedding_dimension} dimensions. "
                            f"Deleting and recreating index..."
                        )
                        # Delete the existing index
                        self.pc.delete_index(self.index_name)
                        logger.info(f"Deleted index {self.index_name}. Waiting before recreation...")
                        time.sleep(5)  # Wait a bit for deletion to complete
                        
                        # Recreate with correct dimension
                        logger.info(f"Creating Pinecone index: {self.index_name} with dimension {self.embedding_dimension}")
                        self.pc.create_index(
                            name=self.index_name,
                            dimension=self.embedding_dimension,
                            metric="cosine",
                            spec=ServerlessSpec(
                                cloud="aws",
                                region="us-east-1"
                            )
                        )
                        logger.info(f"Recreated index {self.index_name} with correct dimension. Waiting for index to be ready...")
                        # Wait for index to be ready
                        max_wait = 60
                        wait_time = 0
                        while wait_time < max_wait:
                            try:
                                temp_index = self.pc.Index(self.index_name)
                                temp_index.describe_index_stats()
                                logger.info("Index is ready!")
                                break
                            except Exception:
                                time.sleep(2)
                                wait_time += 2
                        if wait_time >= max_wait:
                            logger.warning(f"Index creation may still be in progress. Continuing anyway...")
                        logger.warning(
                            f"Index was recreated with correct dimension. "
                            f"You will need to re-index your PDFs by calling process_pdfs(force_reload=True)"
                        )
                except Exception as e:
                    logger.warning(f"Could not verify index dimension: {e}. Continuing anyway...")
            
            # Connect to the index
            self.index = self.pc.Index(self.index_name)
            logger.info("Successfully connected to Pinecone index")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone index: {e}")
            raise ConnectionError(
                f"Could not connect to Pinecone index '{self.index_name}'. "
                f"Please check your PINECONE_API_KEY and index configuration. Error: {str(e)}"
            )
    
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
        Process all PDFs in the data folder and store in Pinecone
        
        Args:
            force_reload: If True, reprocess all PDFs even if already indexed
        
        Returns:
            Dictionary with processing results
        """
        # Ensure Pinecone index is connected
        self._ensure_index_connected()
        
        # Check if index already has data (indexing should be done only once)
        if not force_reload:
            try:
                stats = self.index.describe_index_stats()
                total_vectors = stats.get('total_vector_count', 0)
                if total_vectors > 0:
                    logger.info(f"Index {self.index_name} already has {total_vectors} vectors. Skipping indexing. Use force_reload=True to reindex.")
                    return {
                        "message": "PDFs already indexed. Use force_reload=True to reindex.",
                        "processed_files": 0,
                        "total_chunks": total_vectors,
                        "already_indexed": True
                    }
            except Exception as e:
                logger.warning(f"Could not check index status: {e}. Proceeding with indexing.")
        
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
                
                # Generate embeddings and store in Pinecone
                vectors_to_upsert = []
                for idx, chunk in enumerate(chunks):
                    try:
                        embedding = self._get_embedding(chunk)
                        vector_id = str(uuid.uuid4())
                        
                        vectors_to_upsert.append({
                            "id": vector_id,
                            "values": embedding,
                            "metadata": {
                                "text": chunk,
                                "source": pdf_path.name,
                                "chunk_index": idx,
                                "total_chunks": len(chunks)
                            }
                        })
                    except Exception as e:
                        logger.error(f"Error processing chunk {idx} from {pdf_path.name}: {e}")
                        continue
                
                # Upsert vectors to Pinecone in batches
                if vectors_to_upsert:
                    # Pinecone recommends batch sizes of 100
                    batch_size = 100
                    for i in range(0, len(vectors_to_upsert), batch_size):
                        batch = vectors_to_upsert[i:i + batch_size]
                        self.index.upsert(vectors=batch)
                    
                    processed_count += 1
                    total_chunks += len(vectors_to_upsert)
                    logger.info(f"Stored {len(vectors_to_upsert)} chunks from {pdf_path.name} in Pinecone")
                
            except Exception as e:
                logger.error(f"Error processing PDF {pdf_path.name}: {e}")
                continue
        
        return {
            "message": "PDFs processed successfully",
            "processed_files": processed_count,
            "total_chunks": total_chunks
        }
    
    def _search_relevant_chunks(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant chunks in Pinecone"""
        # Ensure Pinecone index is connected
        self._ensure_index_connected()
        
        try:
            # Get query embedding
            query_embedding = self._get_embedding(query)
            
            # Ensure query_embedding is a list of floats (not numpy array)
            if not isinstance(query_embedding, list):
                query_embedding = query_embedding.tolist() if hasattr(query_embedding, 'tolist') else list(query_embedding)
            
            # Ensure top_k is valid (must be > 1 for Pinecone)
            if top_k < 2:
                top_k = 2
                logger.warning(f"top_k must be > 1, using {top_k} instead")
            
            logger.debug(f"Query embedding dimension: {len(query_embedding)}, top_k: {top_k}")
            
            # Query Pinecone index - use the correct format from Pinecone SDK
            # Format: index.query(vector=[...], top_k=int, include_metadata=bool)
            search_results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            # Format results - Pinecone returns QueryResponse object with matches attribute
            chunks = []
            
            if hasattr(search_results, 'matches') and search_results.matches:
                for match in search_results.matches:
                    # Extract metadata - it's a dict in Pinecone responses
                    metadata = match.metadata if hasattr(match, 'metadata') else {}
                    if not isinstance(metadata, dict):
                        # Convert to dict if it's an object
                        metadata = dict(metadata) if hasattr(metadata, '__dict__') else {}
                    
                    chunks.append({
                        "text": metadata.get("text", ""),
                        "source": metadata.get("source", ""),
                        "score": float(match.score) if hasattr(match, 'score') else 0.0
                    })
            else:
                logger.warning(f"No matches found in search results. Response type: {type(search_results)}")
            
            return chunks
        except Exception as e:
            logger.error(f"Error searching chunks: {e}")
            raise ConnectionError(
                f"Failed to query Pinecone index. "
                f"Make sure the index '{self.index_name}' exists and has been indexed. "
                f"Error: {str(e)}"
            )
    
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
                # Check if index is empty
                try:
                    stats = self.index.describe_index_stats()
                    total_vectors = stats.get('total_vector_count', 0)
                    if total_vectors == 0:
                        return {
                            "response": "The knowledge base is empty. Please process PDFs first by calling the /api/chatbot/process-pdfs endpoint.",
                            "sources": [],
                            "chunks_used": 0
                        }
                except Exception:
                    pass
                
                return {
                    "response": "I couldn't find relevant information in the documents. Please try rephrasing your question or ensure PDFs have been processed.",
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
        """Get information about the Pinecone index"""
        try:
            # Ensure Pinecone index is connected
            self._ensure_index_connected()
            
            stats = self.index.describe_index_stats()
            return {
                "index_name": self.index_name,
                "total_vector_count": stats.get('total_vector_count', 0),
                "dimension": stats.get('dimension', 0),
                "index_fullness": stats.get('index_fullness', 0)
            }
        except ConnectionError as e:
            return {"error": str(e), "pinecone_connected": False}
        except Exception as e:
            logger.error(f"Error getting index info: {e}")
            return {"error": str(e), "pinecone_connected": False}


# Global chatbot instance (lazy initialization)
_chatbot_instance: Optional[RAGChatbot] = None

def get_chatbot() -> RAGChatbot:
    """Get or create chatbot instance"""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = RAGChatbot()
    return _chatbot_instance
