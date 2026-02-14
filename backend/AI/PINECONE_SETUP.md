# Pinecone Configuration Guide

## Required Configuration

To use Pinecone with this RAG chatbot, you need to set up the following:

### 1. Environment Variables

Create a `.env` file in the `takra/backend` directory (or set these as environment variables) with:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here

# Optional: Customize index name (default: "takrapdfs")
# PINECONE_INDEX_NAME=takrapdfs

# Gemini API Key (required for LLM responses)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Get Your Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Copy your API key
5. Paste it in your `.env` file as `PINECONE_API_KEY`

### 3. Index Configuration

The chatbot will automatically:
- **Create the index** if it doesn't exist (named `takrapdfs` by default)
- **Use existing index** if it already exists
- **Wait for index to be ready** after creation (up to 60 seconds)

**Index Specifications:**
- **Dimension**: 384 (from `all-MiniLM-L6-v2` embedding model)
- **Metric**: Cosine similarity
- **Type**: Serverless (AWS, us-east-1 region)

### 4. First-Time Setup

1. **Install dependencies:**
   ```bash
   cd takra/backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   - Create `.env` file with `PINECONE_API_KEY` and `GEMINI_API_KEY`

3. **Process PDFs (one-time indexing):**
   ```bash
   # Start your backend server
   python server.py
   
   # Then call the endpoint to process PDFs:
   curl -X POST http://localhost:8000/api/chatbot/process-pdfs
   ```
   
   Or use the frontend to trigger PDF processing.

### 5. Verify Configuration

Check if Pinecone is configured correctly:

```bash
# Health check endpoint
curl http://localhost:8000/api/chatbot/health

# Get index information
curl http://localhost:8000/api/chatbot/collection-info
```

### 6. Troubleshooting

**Error: "PINECONE_API_KEY not found"**
- Make sure your `.env` file is in the `takra/backend` directory
- Verify the API key is set correctly: `PINECONE_API_KEY=your_key_here`
- Restart your backend server after adding the `.env` file

**Error: "Could not connect to Pinecone index"**
- Verify your API key is correct
- Check your internet connection
- Ensure Pinecone service is accessible

**Error: "Index creation failed"**
- Check if you have sufficient Pinecone credits/quota
- Verify the index name doesn't conflict with existing indexes
- Check Pinecone console for any errors

**Index is empty after processing**
- Make sure PDFs are in `takra/backend/AI/data/` folder
- Check backend logs for processing errors
- Verify embeddings are being generated correctly

### 7. Index Management

**View your indexes:**
- Go to [Pinecone Console](https://app.pinecone.io/)
- Navigate to **Indexes** section
- You should see your index (default: `takrapdfs`)

**Delete and recreate index:**
- If you need to reindex everything, you can delete the index in Pinecone console
- The chatbot will automatically create a new one on next use

**Change index name:**
- Set `PINECONE_INDEX_NAME` in your `.env` file
- Or modify the default in `chatbot.py`: `index_name: str = "your_index_name"`

### 8. Cost Considerations

Pinecone Serverless pricing:
- Free tier: Limited storage and queries
- Pay-as-you-go: Based on usage
- Check [Pinecone Pricing](https://www.pinecone.io/pricing/) for details

**Tips to reduce costs:**
- Process PDFs only once (indexing is one-time)
- Use appropriate chunk sizes (current: 1000 words)
- Monitor your usage in Pinecone console

## Summary

**Minimum Required:**
1. ✅ `PINECONE_API_KEY` in `.env` file
2. ✅ `GEMINI_API_KEY` in `.env` file
3. ✅ PDFs in `takra/backend/AI/data/` folder
4. ✅ Run `/api/chatbot/process-pdfs` once to index PDFs

The chatbot will handle everything else automatically!
