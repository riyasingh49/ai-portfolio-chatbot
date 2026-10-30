# Deployment Guide

## Overview

The AI Portfolio Assistant is deployed using Vercel. Supabase provides the database and authentication services, while Groq and Cloudflare Workers AI provide the language-model and embedding capabilities.

## Prerequisites

Before deploying, ensure you have:

- A GitHub account with access to the project repository.
- A Vercel account.
- A Supabase project.
- A Groq API key.
- Cloudflare account credentials for Workers AI.

## 1. Clone the Repository

```bash
git clone https://github.com/riyasingh49/ai-portfolio-chatbot.git

cd ai-portfolio-chatbot
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env.local` file in the project root.

Configure the following variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_ANON_KEY` | Supabase public/anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged Supabase key |
| `GROQ_API_KEY` | Groq API authentication |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers AI API token |

Use the actual variable names referenced by your source code. Never commit `.env.local` or expose secret credentials in client-side code.

## 4. Prepare Supabase

Ensure your Supabase project has the required:

- PostgreSQL tables.
- pgvector extension and vector-search configuration.
- Database functions used by the application.
- Authentication providers and redirect URLs.
- Appropriate Row Level Security policies.

The database schema and SQL setup should be maintained separately and documented in [DATABASE.md](./DATABASE.md).

## 5. Prepare the Knowledge Base

The source knowledge is stored in:

```text
data/knowledge_base.json
```

The embedding script is:

```text
scripts/embed-knowledge.ts
```

Run the ingestion script when the knowledge base needs to be populated or updated:

```bash
npx tsx --env-file=.env.local scripts/embed-knowledge.ts
```

Ensure the required environment variables are configured before running it.

## 6. Run Locally

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 7. Deploy to Vercel

1. Push the project repository to GitHub.
2. Sign in to Vercel.
3. Import the GitHub repository.
4. Configure the required environment variables in Vercel.
5. Deploy the application.
6. Verify the deployment and application functionality.

## 8. Production Verification

After deployment, verify:

- The application loads successfully.
- Authentication flows work correctly.
- Guest access behaves as expected.
- Chat responses are generated successfully.
- Knowledge retrieval returns relevant information.
- Conversation history works correctly.
- Email drafting behaves as expected.

If production behavior differs from local behavior, compare environment variables, database contents, deployed code, and service configuration.

## Security Checklist

- Never commit `.env.local`.
- Never expose service-role credentials in browser code.
- Store production secrets in Vercel environment variables.
- Restrict database access through appropriate authorization and RLS policies.
- Keep API credentials out of logs and error messages.

## Related Documentation

- [Architecture](./ARCHITECTURE.md)
- [RAG Pipeline](./RAG_PIPELINE.md)
- [Database Design](./DATABASE.md)
- [Authentication](./AUTHENTICATION.md)
- [Rate Limiting](./RATE_LIMITING.md)