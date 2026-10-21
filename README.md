# AI Portfolio Chatbot

A chatbot that answers questions about my background, skills, projects and experience, so a recruiter or hiring manager can simply ask instead of scanning a resume. It is built on a Retrieval-Augmented Generation (RAG) pipeline over a curated knowledge base, with streaming responses, user accounts and saved conversations.

**Live demo:** https://ai-portfolio-chatbot-65kk.vercel.app

---

## What It Does

- **Answers questions about me** — retrieves the most relevant facts from my knowledge base and uses them to ground each answer; the model is instructed to say so when something isn't covered
- **Streams responses** — answers appear as they are generated
- **Saves conversations** — multiple chat threads per user, switchable and deletable, with full history
- **Guest access** — visitors can try it without an account (limited to 10 questions); signing in links their guest chats to their account
- **Authentication** — email/password, Google sign-in and password reset
- **Drafts emails** — ask it to write an email and it returns an editable draft you can open in your email app

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Embeddings | Cloudflare Workers AI (`bge-small-en-v1.5`, 384 dimensions) |
| Vector search | Supabase Postgres + `pgvector` |
| Auth & storage | Supabase Auth and Postgres |
| LLM | Groq API (`openai/gpt-oss-20b`), streaming, with tool calling |
| Hosting | Vercel |

## Architecture

```
User question
   │
   ▼
Frontend (React hook) ── question + session / user context
   │
   ▼
POST /api/chat  (Next.js Route Handler)
   ├─► Guest limit check
   ├─► Resolve or create the conversation
   ├─► Load recent conversation history
   │
   ▼
Embed the question  (Cloudflare Workers AI)
   │
   ▼
Semantic search  (Supabase pgvector) ── top matching knowledge entries
   │
   ▼
Groq LLM ── system prompt + retrieved context + history + question
   │
   ├─► text ───────────────► streamed to the browser token by token
   └─► draft_email call ───► rendered as an editable email card
   │
   ▼
Save the exchange to Postgres and title the conversation
```

### The RAG pipeline

1. **Knowledge base** — my professional information lives in `data/knowledge_base.json` as short, self-contained entries.
2. **Embedding** — a script embeds each entry and stores the vector in Supabase (`pgvector`).
3. **Retrieval** — each question is embedded with the same model and matched by similarity; the top matches are passed to the LLM as context.
4. **Generation** — Groq streams the answer back, guided by a system prompt that keeps responses on topic and based on the retrieved context.

### Code organization

- `src/app/api/chat/route.ts` — the streaming chat endpoint
- `src/lib/` — embeddings, retrieval, LLM calls, tool definitions, Supabase clients, auth helpers
- `src/db/` — database queries, one file per table
- `src/actions/` — Server Actions for non-streaming work (conversations, guest-to-user linking)
- `src/hooks/` — `useChat` (streaming and state) and `useAuthListener`
- `src/components/` — chat UI, sidebar, email draft card, auth forms
- `scripts/embed-knowledge.ts` — generates and stores embeddings

## Design Decisions

- **RAG over fine-tuning** — the data is a small set of facts that changes over time; with RAG, updating an answer means editing a JSON entry and re-running the embed script.
- **Route Handler for chat, Server Actions elsewhere** — Server Actions return one value on completion and can't stream, so the chat endpoint is a Route Handler built on `ReadableStream`; everything else uses Server Actions.
- **Exact vector search** — at this dataset size (~30 entries), exact search is accurate and fast, so no approximate index is used.
- **Hosted embeddings** — embedding generation is isolated behind one function and calls a hosted API, which keeps it compatible with Vercel's serverless runtime.

## Running Locally

Requires Node.js 20.9+, a Supabase project (with `pgvector`), a Groq API key and a Cloudflare Workers AI token.

```bash
git clone https://github.com/riyasingh49/ai-portfolio-chatbot.git
cd ai-portfolio-chatbot
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

Embed the knowledge base, then start the app:

```bash
npx tsx --env-file=.env.local scripts/embed-knowledge.ts
npm run dev
```

## About

Built by **Riya Singh** as a personal project to explore RAG, streaming LLM responses and full-stack authentication.

## License

Personal project — not licensed for reuse.
