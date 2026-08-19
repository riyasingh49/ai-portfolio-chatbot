# AI Portfolio Chatbot

A conversational AI that answers questions about me — grounded entirely in my own data, with no hallucination outside that scope. Built end-to-end as a personal project to explore Retrieval-Augmented Generation (RAG), streaming LLM responses, and full-stack authentication, on a fully free, TypeScript-based infrastructure.

**Live demo:** https://ai-portfolio-chatbot-65kk.vercel.app

---

## Overview

This isn't a wrapper around a chatbot API — it's a full RAG pipeline built from the ground up: personal data is chunked and embedded, stored as vectors, semantically retrieved per question, and used to ground an LLM's response, with the entire flow streamed word-by-word back to the user. On top of that sits multi-thread conversation management, guest access with usage limits, and full authentication — the same shape of product decisions a real SaaS chat product has to make.

## Features

- **Grounded Q&A** — answers only from my personal data; explicitly declines out-of-scope questions rather than guessing
- **Multi-thread conversations** — multiple saved chats per user, switchable and deletable, like a typical AI chat product
- **Live streaming responses** — word-by-word output via the Web Streams API, not a single blocking response
- **Guest access with limits** — unauthenticated users get a limited number of questions before sign-in is required, with their conversation preserved and linked to their account on login
- **Full authentication** — email/password and Google OAuth, plus password reset, via Supabase Auth
- **Persistent history** — every conversation stored and retrievable across sessions

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (TypeScript, App Router) |
| Styling | Tailwind CSS |
| Embeddings | [Hugging Face Inference API](https://huggingface.co/docs/api-inference/) (`all-MiniLM-L6-v2`) |
| Vector Search | [Supabase](https://supabase.com/) + `pgvector` |
| Authentication | Supabase Auth (email/password + Google OAuth) |
| Conversation Storage | Supabase (Postgres) |
| LLM Inference | [Groq API](https://groq.com/) (`openai/gpt-oss-20b`) |
| Hosting | [Vercel](https://vercel.com/) |

## Architecture

```
User question
   │
   ▼
Frontend (React hook) ── sends question + session/user context
   │
   ▼
Next.js Route Handler (/api/chat)
   │
   ├─► Guest limit check (if not authenticated)
   ├─► Resolve/create conversation (Supabase)
   ├─► Fetch recent conversation history (Supabase)
   │
   ▼
Embed question (Hugging Face Inference API)
   │
   ▼
Semantic search (Supabase / pgvector) ── top matching knowledge chunks
   │
   ▼
Groq API (LLM) ── system prompt + context + history + question
   │
   ▼
Streamed response ── sent word-by-word back to the browser
   │
   ▼
Save question + answer (Supabase) ── conversation history persisted
```

**Layered separation of concerns:**
- `lib/` — infrastructure and orchestration (clients, embedding calls, retrieval logic, LLM calls)
- `db/` — one file per database table; every query for that table lives there, nowhere else
- `actions/` — Server Actions, used where streaming isn't required
- `app/api/` — Route Handlers, used specifically for the streaming chat endpoint, since Server Actions can't stream

## Key Technical Decisions

**RAG over fine-tuning.** Fine-tuning a model on a small, factual personal dataset risks blending memorized facts with pretrained knowledge, making hallucination hard to bound. RAG guarantees scope control — the model only ever sees retrieved context at answer time.

**Route Handlers for chat, Server Actions elsewhere.** Server Actions return a single value on completion — they can't stream. The chat endpoint needed live, incremental output, so it's a Route Handler using `ReadableStream`; everything else that doesn't need streaming (auth linking, conversation management) uses Server Actions for their simpler client-calling ergonomics.

**Exact search over approximate indexing.** An `ivfflat` vector index was initially added by default, but at this dataset's scale (~30 rows), approximate indexing with a `lists` parameter tuned for large datasets caused the index to silently return near-random results. Diagnosed via direct similarity-score inspection and resolved by dropping the index — exact search is faster and fully accurate at this scale, and approximate indexing only pays off at far larger row counts.

**Hosted embeddings over local inference in production.** Embeddings were originally generated locally via Transformers.js. This broke in Vercel's serverless environment, since `onnxruntime-node`'s native binary isn't available there. Rather than moving off Vercel, the embedding call was swapped to Hugging Face's hosted Inference API — a contained, single-function change, since embedding generation was already isolated behind one interface used everywhere else in the app.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts       # Streaming chat endpoint
│   │   ├── auth/callback/route.ts  # OAuth callback handler
│   │   ├── login/                  # Sign-in page
│   │   ├── register/               # Sign-up page
│   │   ├── forgot-password/        # Password reset request page
│   │   ├── reset-password/         # Set new password page
│   │   └── page.tsx                # Main chat interface
│   ├── components/                 # ChatBox, Sidebar, SignInDialog, Navbar
│   ├── hooks/                      # useChat, useAuthListener
│   ├── actions/                    # Server Actions (auth, conversations)
│   ├── lib/                        # Clients, embeddings, retrieval, LLM calls, auth helpers
│   ├── db/                         # Database queries, one file per table
│   └── types/                      # Shared TypeScript types
├── data/
│   └── knowledge_base.json         # Source personal data
└── scripts/
    └── embed-knowledge.ts          # One-time embedding generation script
```

## Running Locally

```bash
git clone https://github.com/riyasingh49/ai-portfolio-chatbot.git
cd ai-portfolio-chatbot
npm install
```

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
HUGGINGFACE_API_KEY=
```

Generate embeddings for the knowledge base, then run the dev server:
```bash
npx tsx --env-file=.env.local scripts/embed-knowledge.ts
npm run dev
```

## License

Personal project — not licensed for reuse.
