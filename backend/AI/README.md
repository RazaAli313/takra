# RAG Chatbot Setup Guide

This RAG (Retrieval-Augmented Generation) chatbot uses Qdrant vector database and Google Gemini API to answer questions based on PDF documents in the `data` folder.

## Prerequisites

1. **Qdrant Vector Database**: You need to have Qdrant running. You can either:
   - Run Qdrant locally using Docker: `docker run -p 6333:6333 qdrant/qdrant`
   - Use Qdrant Cloud (set QDRANT_URL and QDRANT_API_KEY environment variables)

2. **Google Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r ../requirements.txt
   ```

2. **Set Environment Variables**:
   Add your API keys to your `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   QDRANT_URL=https://your-cluster-id.region.aws.cloud.qdrant.io:6333
   QDRANT_API_KEY=your_qdrant_api_key_here
   ```
   
   **For local Qdrant** (no API key needed):
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   QDRANT_URL=http://localhost:6333
   ```

3. **Start Qdrant** (only if running locally):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

4. **Process PDFs**:
   First, you need to process the PDFs in the `data` folder to index them:
   ```bash
   # Via API endpoint
   POST /api/chatbot/process-pdfs
   ```

## API Endpoints

### 1. Chat with the Bot
```
POST /api/chatbot/chat
Body: {
  "query": "Your question here",
  "top_k": 5  // optional, default is 5
}
```

### 2. Process PDFs
```
POST /api/chatbot/process-pdfs?force_reload=false
```
This will extract text from all PDFs in the `data` folder, create embeddings, and store them in Qdrant.

### 3. Get Collection Info
```
GET /api/chatbot/collection-info
```
Returns information about the Qdrant collection (number of documents, etc.)

### 4. Health Check
```
GET /api/chatbot/health
```
Check if the chatbot service is running properly.

## Usage Example

1. **First, process your PDFs**:
   ```bash
   curl -X POST http://localhost:8000/api/chatbot/process-pdfs
   ```

2. **Ask a question**:
   ```bash
   curl -X POST http://localhost:8000/api/chatbot/chat \
     -H "Content-Type: application/json" \
     -d '{"query": "What are the rules for the competition?"}'
   ```

## Configuration

You can customize the chatbot by setting environment variables or modifying the initialization parameters in `chatbot.py`:

**Environment Variables:**
- `GEMINI_API_KEY`: Google Gemini API key (required)
- `QDRANT_URL`: Qdrant server URL (default: "http://localhost:6333")
- `QDRANT_API_KEY`: Qdrant API key for cloud instances (optional, required for Qdrant Cloud)

**Initialization Parameters:**
- `qdrant_url`: Qdrant server URL (defaults to QDRANT_URL env var or "http://localhost:6333")
- `qdrant_api_key`: Qdrant API key (defaults to QDRANT_API_KEY env var)
- `collection_name`: Name of the Qdrant collection (default: "takra_pdfs")
- `data_folder`: Path to PDF folder (default: "data")
- `embedding_model_name`: Sentence transformer model (default: "all-MiniLM-L6-v2")

## Notes

- The chatbot uses sentence-transformers for embeddings (more reliable than Gemini embeddings)
- Gemini is used for text generation based on retrieved context
- PDFs are automatically chunked with overlap for better context retrieval
- The system supports multiple PDFs in the data folder