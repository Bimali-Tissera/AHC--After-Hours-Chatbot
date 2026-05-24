# n8n Workflows Reference
> These workflows are ALREADY BUILT. Do not recreate them. 
> Claude Code should only interact with them via their webhook endpoints.

---

## Workflow 1 — Update KB (Knowledge Base)

**Purpose:** Chunks the FAQ document into smaller pieces, generates vector embeddings, and stores them in Pinecone.

**Trigger:** Manual (run when FAQ doc is updated)
**Input:** `Dental_FAQ_Knowledge_Base_v1.docx` or updated version
**Output:** FAQ chunks stored as vector embeddings in Pinecone index — ready for semantic similarity search by the AI Assistant workflow

**This workflow is complete. Do not modify it.**

---

## Workflow 2 — AI Assistant (Core Chatbot Logic)

**Purpose:** Receives patient messages, retrieves relevant FAQ context from Pinecone, processes with OpenAI, returns responses.

**⚠️ Note:** This workflow currently handles FAQ retrieval and AI response only. It does NOT yet write chat/lead data to Supabase (Supabase isn't set up yet). Once Supabase is ready, a storage step needs to be added to this workflow.

**Trigger:** `When chat message received` (n8n built-in chat trigger)

### Request Format
```json
{
  "practice_id": "uuid",
  "chat_id": "uuid",
  "message": "Do you take Delta Dental?"
}
```

### n8n Node Structure (from workflow screenshot)
- **AI Agent** — orchestrator node
  - **Chat Model**: OpenAI Chat Model
  - **Memory**: Simple Memory (maintains conversation context within a session)
  - **Tool**: "Answer questions with a vector store"
    - **Vector Store**: Pinecone Vector Store
    - **Vector Store Model**: OpenAI Chat Model (second instance)
    - **Embeddings**: OpenAI Embeddings (used to embed the patient's query for Pinecone similarity search)

### Internal Flow
1. Patient sends a message via `When chat message received` trigger
2. AI Agent receives the message
3. "Answer questions with a vector store" tool is called:
   - Patient message is embedded using OpenAI Embeddings
   - Pinecone is queried for the most semantically similar FAQ chunks
   - Retrieved FAQ context is passed to OpenAI Chat Model for answer generation
4. Simple Memory provides conversation history context
5. AI Agent returns the response
6. *(TODO once Supabase is set up)* Store chat + message in Supabase
7. *(TODO once Supabase is set up)* Store lead if captured

### Response
The AI Agent returns a natural language text response back to the chat trigger. The frontend receives this as a plain text message.

**Important for frontend integration:** Since this uses n8n's built-in chat trigger (not a raw webhook), the Chat Widget will need to connect via n8n's chat interface URL or be adapted to use a webhook trigger if a custom POST endpoint is preferred.

---

## Environment Variables Needed in Next.js

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # server-side only
```

## Environment Variables in n8n (already configured)

```env
PINECONE_API_KEY=...
PINECONE_INDEX=...
OPENAI_API_KEY=...   # used for both Chat Model and Embeddings
```
