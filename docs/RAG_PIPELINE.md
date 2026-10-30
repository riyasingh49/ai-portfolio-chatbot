# RAG Pipeline

## Overview

The AI Portfolio Assistant uses Retrieval-Augmented Generation (RAG) to answer questions about Riya's professional background, skills, projects, education, and experience.

Instead of relying entirely on the language model's pre-trained knowledge, the application retrieves relevant information from a curated knowledge base and provides it as context when generating a response.

This helps keep answers relevant to Riya's actual profile and reduces unsupported or fabricated information.

## Technology Used

- **Embedding Model:** Cloudflare Workers AI — `@cf/baai/bge-small-en-v1.5`
- **Embedding Dimensions:** 384
- **Vector Storage:** Supabase
- **Language Model:** Groq — `openai/gpt-oss-20b`
- **Generation:** Streaming responses
- **Application Framework:** Next.js with TypeScript

## RAG Workflow

The application follows these steps when a user submits a question.

### 1. User submits a question

The frontend sends the question to the chat API.

The API validates the request and checks the user's session, authentication status, and conversation context.

### 2. Request validation and rate limiting

Before processing the question, the server validates the request and applies rate-limiting checks.

This helps control excessive requests and protects the application from unnecessary processing.

### 3. Query embedding generation

The application converts the user's question into a numerical vector using Cloudflare Workers AI.

The embedding model used is:

`@cf/baai/bge-small-en-v1.5`

The generated vector represents the semantic meaning of the question and is used to find relevant information.

### 4. Relevant context retrieval

The application uses the generated embedding to search the knowledge base through Supabase.

It retrieves the most relevant information based on semantic similarity.

The current retrieval implementation uses a similarity threshold of `0.15` and requests up to `12` matching results.

### 5. Context preparation

The retrieved information is passed to the language model as contextual input.

The application also considers recent conversation history to maintain continuity across messages.

The system instructions guide the model to:
- Answer using the provided information about Riya.
- Avoid inventing personal or professional details.
- Avoid making unsupported assumptions.
- Keep responses relevant to the user's question.

### 6. Response generation

The retrieved context and conversation history are passed to Groq.

The configured model is:

`openai/gpt-oss-20b`

The application uses a temperature of `0.3` and enables streaming to deliver generated responses progressively.

### 7. Streaming and response handling

The chat API streams the generated response to the frontend.

The frontend displays incoming text as it arrives.

The application also supports a custom email-drafting tool. When the model generates an email draft, the response is handled separately so the frontend can display it using the email draft interface.

## Knowledge Base Ingestion

The knowledge base is maintained using structured content stored in:

`data/knowledge_base.json`

The ingestion script:

1. Reads the knowledge base content.
2. Generates embeddings for the entries.
3. Processes the generated embeddings.
4. Inserts the content into the vector storage system.

**Important:** The current ingestion script clears the existing knowledge base before inserting the new content. Review the script and confirm the target environment before running it, because existing records may be replaced.

## Error Handling and Limitations

- The application validates incoming chat requests.
- Authentication and session checks are performed before processing.
- Rate limiting helps prevent excessive requests.
- Responses depend on the quality and relevance of the available knowledge base.
- If relevant information is missing, the model is instructed not to invent an answer.
- External embedding and language-model services must be available for the complete RAG workflow.

## Summary

The RAG pipeline combines semantic retrieval with language-model generation to provide context-aware answers about Riya's professional profile.

The overall process is:

**User Question → Query Embedding → Context Retrieval → Context Preparation → LLM Generation → Streaming Response**