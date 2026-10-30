# Deployment Guide

## Overview

The AI Portfolio Assistant is deployed using Vercel and built with Next.js.

The application integrates with external services for authentication, data storage, embedding generation, and AI-powered response generation.

This guide explains the deployment process and configuration requirements.

## Technology

- **Framework:** Next.js
- **Language:** TypeScript
- **Hosting:** Vercel
- **Authentication and Backend Services:** Supabase
- **Embedding Provider:** Cloudflare Workers AI
- **Language Model Provider:** Groq
- **Version Control:** GitHub

## Prerequisites

Before deploying the application, ensure you have:

- A GitHub account.
- A Vercel account.
- A Supabase project.
- Cloudflare Workers AI access.
- A Groq API key.
- The project source code available in a GitHub repository.

## Environment Configuration

The application requires environment variables to connect to its external services.

Configure the following categories of variables in your deployment environment:

| Service | Configuration |
|---|---|
| Supabase | Project URL and public client key |
| Supabase Admin | Server-side service-role credentials |
| Cloudflare Workers AI | Account configuration and API credentials |
| Groq | API key for language-model access |

Use the variable names referenced by the application's source code when configuring Vercel.

**Important:**
- Never commit `.env.local` or other secret files to GitHub.
- Never expose service-role credentials or provider API keys in frontend code.
- Use Vercel environment variables for production configuration.
- Keep development and production credentials separate.

## Deploying to Vercel

### 1. Push the Project to GitHub

Ensure the project is committed and pushed to the intended GitHub branch.

### 2. Import the Repository

1. Sign in to Vercel.
2. Select **Add New → Project**.
3. Import the GitHub repository.
4. Allow Vercel to detect the Next.js framework.

### 3. Configure Environment Variables

Add the required environment variables in the project's Vercel settings.

Ensure that all required variables are configured for the intended deployment environment.

### 4. Deploy the Application

Start the deployment through Vercel.

Vercel installs dependencies, builds the Next.js application, and deploys the resulting application.

### 5. Verify the Deployment

After deployment:

- Open the deployed application.
- Verify that the homepage loads correctly.
- Test guest chat functionality.
- Test email/password authentication.
- Test Google OAuth.
- Verify conversation history.
- Verify AI-generated responses.
- Test the email-drafting feature.
- Check deployment logs for runtime errors.

## Production Checklist

Before making the application publicly available, verify the following:

- [ ] All required environment variables are configured.
- [ ] No secrets are committed to the repository.
- [ ] Production authentication settings are configured.
- [ ] OAuth redirect URLs point to the correct deployment domain.
- [ ] External AI services are accessible.
- [ ] Chat requests are processed successfully.
- [ ] Streaming responses work correctly.
- [ ] Guest and authenticated sessions behave as expected.
- [ ] Rate limiting works correctly.
- [ ] Conversation history is persisted correctly.
- [ ] Production logs do not expose sensitive user information.

## Troubleshooting

### Application Builds but AI Responses Fail

Possible causes:

- Missing or incorrectly configured provider credentials.
- Incorrect environment-variable values.
- External service availability issues.
- Runtime configuration differences between local and production environments.

Check the Vercel runtime logs and verify the required service configuration.

### Authentication Does Not Work

Check:

- Supabase authentication settings.
- OAuth provider configuration.
- Allowed redirect URLs.
- Production environment variables.
- Authentication callback behavior.

### Chat Works Locally but Fails on Vercel

Local and production environments may differ.

Verify that:

- All required environment variables are configured in Vercel.
- Server-side credentials are available at runtime.
- External API requests are successful.
- Production logs do not contain runtime or network errors.

## Summary

The application uses Vercel for deployment and integrates with Supabase, Cloudflare Workers AI, and Groq for its backend and AI capabilities.

Correct environment configuration and production verification are essential for reliable deployment.