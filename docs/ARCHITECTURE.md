# System Architecture

## Overview

The AI Portfolio Assistant is a full-stack application built to answer questions about Riya's professional background, technical skills, projects, education, and experience.

It uses a Retrieval-Augmented Generation (RAG) architecture to retrieve relevant profile information before generating responses with a language model.

The application supports guest users, authenticated users, conversation history, streaming responses, and AI-assisted email drafting.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Authentication | Supabase Auth |
| Backend | Next.js Route Handlers and Server Actions |
| Vector Storage | Supabase |
| Embeddings | Cloudflare Workers AI |
| Language Model | Groq |
| Deployment | Vercel |
| Version Control | Git and GitHub |

## High-Level Architecture

The application is organized into the following layers:

### 1. Frontend Layer

The frontend provides the user interface for interacting with the AI assistant.

Main components include:

- **ChatBox:** Displays messages and handles user interactions.
- **Sidebar:** Provides access to conversation history and conversation management.
- **Navbar:** Provides navigation and authentication-related actions.
- **EmailDraftCard:** Displays generated email drafts.

The frontend uses custom React hooks to manage chat state, authentication changes, and conversation interactions.

### 2. API and Application Layer

The backend is implemented using Next.js Route Handlers and Server Actions.

Its responsibilities include:

- Receiving and validating chat requests.
- Managing authenticated and guest sessions.
- Handling conversation operations.
- Retrieving conversation history.
- Applying rate limits.
- Coordinating retrieval and response generation.
- Streaming responses to the frontend.

The primary chat endpoint is:

`POST /api/chat`

### 3. Authentication Layer

Supabase Auth handles user authentication.

Supported authentication features include:

- Email and password registration.
- Email and password sign-in.
- Google OAuth.
- Password reset and update.

Guest users can interact with the assistant without creating an account. Their sessions are maintained using a browser-generated session identifier.

When a guest signs in, the application supports linking their guest conversation history to their authenticated account.

### 4. Retrieval Layer

The retrieval layer is responsible for finding information relevant to the user's question.

Its workflow includes:

1. Generating an embedding for the question.
2. Searching the knowledge base for semantically relevant content.
3. Returning matching information.
4. Passing the retrieved context to the response-generation layer.

Cloudflare Workers AI provides the embedding model, while Supabase provides vector storage and retrieval capabilities.

### 5. AI Generation Layer

The AI generation layer combines retrieved information with recent conversation history.

Groq provides the language model used to generate responses.

The application uses streaming so that users can see responses progressively rather than waiting for the entire answer.

The AI layer also supports a custom email-drafting tool.

### 6. Data and Persistence Layer

Supabase provides the application's managed backend services.

It is used for:

- Authentication.
- Knowledge-base storage and retrieval.
- Conversation persistence.
- Message history.

The application separates data access and business logic into dedicated modules to keep the codebase organized.

## Request Lifecycle

A typical chat request follows this sequence:

1. The user submits a question through the chat interface.
2. The frontend sends the request to the chat API.
3. The backend validates the request and identifies the user session.
4. Rate-limiting checks are performed.
5. Recent conversation history is retrieved.
6. The retrieval layer finds relevant knowledge-base content.
7. The AI generation layer receives the question, conversation history, and retrieved context.
8. Groq generates a response.
9. The API streams the response to the frontend.
10. The conversation is persisted for future access.

## Project Structure

The main application code is organized as follows:

```text
src/
├── actions/       # Server actions
├── app/           # Next.js routes and pages
│   ├── api/       # API endpoints
│   └── auth/      # Authentication callback
├── components/    # Reusable UI components
├── db/            # Data-access modules
├── hooks/         # Custom React hooks
├── lib/           # Core application logic
└── types/         # TypeScript definitions

data/
└── knowledge_base.json

scripts/
└── embed-knowledge.ts

docs/
└── Project documentation
```

## Deployment Architecture

The application is deployed on Vercel.

The deployment integrates with the external services required by the application:

- Supabase for authentication and data services.
- Cloudflare Workers AI for embedding generation.
- Groq for language-model inference.

Environment-specific configuration is managed through deployment environment variables rather than hardcoded application values.

## Design Considerations

The architecture follows a modular approach:

- **Separation of concerns:** UI, API handling, retrieval, and AI generation are organized into separate modules.
- **Type safety:** TypeScript provides type checking across the application.
- **Scalable deployment:** The application uses managed cloud services and serverless deployment.
- **Streaming:** Responses are delivered progressively for a better chat experience.
- **Session management:** Both guest and authenticated users are supported.
- **Context-aware generation:** Retrieved information helps ground AI responses in the portfolio knowledge base.

## Summary

The application combines a Next.js frontend and backend with Supabase, Cloudflare Workers AI, and Groq to deliver a context-aware portfolio assistant.

Its modular architecture makes it easier to maintain the codebase and extend features such as authentication, conversation management, retrieval, and AI-powered responses.