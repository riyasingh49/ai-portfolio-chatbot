# Personal AI Chatbot

A personal chatbot that answers questions about me — grounded only in information I've provided. Built as a personal project to explore Retrieval-Augmented Generation (RAG) with a fully free, TypeScript-based stack.

## What it does

- Answers questions using my own data — nothing outside that scope
- Declines to answer questions it has no information about, instead of guessing
- Continues the same conversation seamlessly after login (no restart)
- Stores full chat history per user, retrievable across sessions
- Deployed publicly — accessible via a link, no local setup required for visitors

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (TypeScript, App Router) |
| Styling | Tailwind CSS |
| Embeddings | [Transformers.js](https://huggingface.co/docs/transformers.js) (`all-MiniLM-L6-v2`, runs locally) |
| Vector Search / RAG | [Supabase](https://supabase.com/) + `pgvector` |
| Authentication | Supabase Auth |
| Conversation Storage | Supabase (Postgres) |
| LLM Inference | [Groq API](https://groq.com/) |
| Hosting | [Vercel](https://vercel.com/) |

## Architecture

Retrieval-Augmented Generation (RAG) — personal data is stored and retrieved semantically, then used to ground LLM-generated answers.

## Status

🚧 In progress — building module by module.

## License

Personal project — not licensed for reuse.
