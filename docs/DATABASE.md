# Data Management

## Overview

The AI Portfolio Assistant uses Supabase as its managed backend service for authentication, knowledge-base operations, and conversation persistence.

The application separates data-access logic from UI components and API handling to keep the codebase modular and maintainable.

This document describes the data-management approach at a high level without exposing internal database schemas or configuration.

## Technology

- **Backend Service:** Supabase
- **Authentication:** Supabase Auth
- **Vector Storage:** Supabase with vector search capabilities
- **Application Backend:** Next.js Server Actions and Route Handlers
- **Language:** TypeScript

## Data Management Responsibilities

### 1. Knowledge Base

The knowledge base contains curated information about Riya's professional profile, including:

- Education
- Technical skills
- Work experience
- Projects
- Certifications and achievements

The application uses semantic search to retrieve relevant information from this content when answering user questions.

Knowledge-base content is maintained in a structured JSON source file and processed through an ingestion script.

### 2. Conversation Management

The application maintains conversation data to support chat history and continuity.

Authenticated users can:

- Start new conversations.
- View previous conversations.
- Switch between conversations.
- Delete conversations.
- Continue previous discussions.

Guest users can also interact with the assistant using a browser-generated session identifier.

### 3. Message History

User questions and assistant responses are persisted so that conversations can be reopened and continued.

Recent conversation messages are used as additional context during response generation.

This helps the assistant maintain continuity when users ask follow-up questions.

### 4. Authentication and User Data

Supabase Auth manages user authentication.

The application supports:

- Email and password authentication.
- Google OAuth.
- Password recovery and updates.
- Guest-to-authenticated conversation linking.

Authenticated requests are validated on the server before user-specific operations are performed.

## Application Data Flow

The application follows this general data flow:

1. The user submits a question.
2. The backend validates the session and request.
3. The application retrieves relevant conversation context.
4. The retrieval layer searches the knowledge base.
5. The AI generation layer creates a response.
6. The question and response are persisted as conversation history.
7. The frontend displays the response.

## Data Access Organization

Data-related operations are separated into dedicated application modules.

The `src/db/` directory contains data-access modules, while server-side business logic is organized separately.

This separation helps avoid coupling database operations directly to frontend components.

## Important Considerations

- Sensitive service credentials must remain server-side.
- Public configuration should use appropriately scoped public keys.
- Access to user-specific conversation data must be validated on the server.
- Knowledge-base updates should be reviewed before ingestion.
- The ingestion script clears existing knowledge-base content before repopulating it, so it should only be run after confirming the target environment and source data.
- Production logs should not expose private user information or retrieved personal content.

## Summary

Supabase provides the managed backend services used by the AI Portfolio Assistant.

The application uses these services to manage authentication, retrieve knowledge-base information, and preserve conversation history while keeping data-access logic separate from the presentation layer.