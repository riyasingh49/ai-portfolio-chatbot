# Authentication and Session Management

## Overview

The AI Portfolio Assistant supports both guest and authenticated users.

Authentication is managed through Supabase Auth, while guest users can access the chat interface without creating an account.

The application provides multiple authentication methods and supports linking guest conversation history to an authenticated account.

## Authentication Methods

The application supports the following methods:

### 1. Email and Password

Users can create an account and sign in using their email address and password.

The application also supports password recovery and password updates.

### 2. Google OAuth

Users can authenticate using their Google account.

The OAuth flow redirects users to Google for authentication and returns them to the application through the configured authentication callback.

### 3. Guest Access

Users can interact with the assistant without registering or signing in.

A browser-generated session identifier is used to maintain the guest session across interactions.

Guest access is subject to application rate limits.

## Authentication Flow

### Sign Up

1. The user submits registration details.
2. The application sends the request to Supabase Auth.
3. Supabase processes the registration.
4. The application handles the resulting authentication state.

### Sign In

1. The user submits their credentials.
2. The application validates them through Supabase Auth.
3. The authenticated session is established.
4. The frontend updates its authentication state.

### Google OAuth

1. The user selects Google sign-in.
2. The application initiates the OAuth flow.
3. Google handles user authentication.
4. The application receives the authorization callback.
5. The callback exchanges the authorization code for a session.
6. The user is redirected to the application.

### Password Recovery

Users can request password recovery through the authentication interface.

The application supports updating the password after the recovery process.

## Guest Session Management

Guest users receive a session identifier generated in the browser using `crypto.randomUUID()`.

The identifier is stored in browser `localStorage` and is used to associate chat requests with the guest session.

Guest sessions are subject to usage restrictions to prevent excessive requests.

## Guest-to-User Conversation Linking

The application supports linking guest conversations to an authenticated account after sign-in.

This allows users to continue accessing their existing conversation history after authentication.

## Server-Side Authentication Validation

Authentication-sensitive operations are validated on the server.

The application verifies access tokens through Supabase before using the associated user identity for protected operations.

This helps prevent requests from accessing another user's authenticated resources.

## Security Considerations

- Authentication is handled through Supabase Auth rather than custom password storage.
- Sensitive credentials must never be exposed in frontend code.
- Server-side operations validate the authenticated user's identity.
- User-specific conversation operations must enforce ownership checks.
- Guest sessions are subject to rate limiting.
- OAuth redirect URLs should be configured for the intended application environments.
- Authentication errors should be handled without exposing sensitive implementation details.

## Summary

The authentication system combines Supabase Auth with browser-based guest sessions to provide flexible access to the AI Portfolio Assistant.

It supports email/password authentication, Google OAuth, password recovery, guest access, and guest conversation linking.