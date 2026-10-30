# Rate Limiting

## Overview

The AI Portfolio Assistant implements server-side rate limiting to control chat usage and protect application resources.

Rate limiting is applied before the retrieval and AI-generation stages of a chat request.

The application uses Supabase-backed request tracking to enforce usage restrictions across guest sessions and authenticated users.

## Rate-Limiting Scope

The application considers different identifiers when evaluating chat requests:

- **Guest session:** Controls usage associated with an individual guest session.
- **IP address:** Helps prevent repeated requests from the same network address.
- **Authenticated user:** Controls usage associated with a signed-in account.

These checks help reduce excessive requests and discourage attempts to bypass guest usage restrictions.

## Request Validation Flow

When a chat request reaches the backend:

1. The API validates the incoming request.
2. The server identifies the user's session and authentication status.
3. The client IP address is extracted from the request headers.
4. The server performs the rate-limit check.
5. If the request is allowed, processing continues.
6. If the request exceeds an applicable limit, the API returns an appropriate error response.

Rate-limit checks are performed before conversation-history retrieval, knowledge-base retrieval, and language-model generation.

## Response Handling

The application uses different HTTP status codes depending on the rejection reason.

| HTTP Status | Purpose |
|---|---|
| `403 Forbidden` | Guest usage limit reached |
| `429 Too Many Requests` | Session, IP, or authenticated-user rate limit reached |
| `503 Service Unavailable` | Rate-limit verification could not be completed |
| `400 Bad Request` | Request rejected for another validation reason |

For requests rejected due to rate limiting, the application can provide a `Retry-After` response header indicating when the client may retry.

## Guest Usage Restrictions

Guest users are subject to additional usage restrictions.

The application checks both session-level and IP-based limits to discourage repeated anonymous requests.

When a guest usage limit is reached, the API returns a response indicating that the guest limit has been reached.

## Authenticated User Restrictions

Signing in does not remove all usage restrictions.

Authenticated requests are also checked against applicable user, session, and IP-based limits.

This helps maintain controlled usage across the application.

## Error Handling

The application handles rate-limiting failures explicitly.

Examples include:

- Guest session usage limit reached.
- Guest IP usage limit reached.
- Session request limit reached.
- Authenticated user request limit reached.
- IP request limit reached.
- Client IP unavailable.
- Rate-limit verification failure.

If rate-limit verification fails, the application does not proceed with expensive retrieval and AI-generation operations.

## Security Considerations

- Rate-limit checks are performed server-side.
- Request tracking is handled through managed backend services.
- Client IP extraction depends on trusted deployment proxy headers.
- Proxy headers should only be trusted when the deployment environment prevents clients from manipulating them.
- Rate-limit configuration should be reviewed before changing guest or authenticated-user access policies.

## Summary

The rate-limiting system protects the AI Portfolio Assistant from excessive chat requests by applying server-side usage checks to guest sessions, IP addresses, and authenticated users.

It helps control resource consumption while maintaining access for legitimate users.