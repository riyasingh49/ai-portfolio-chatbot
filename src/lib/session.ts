'use client'

const SESSION_ID = 'chatbot_session_id';

// Gets the existing guest session ID from localStorage, or creates
// and stores a new one if none exists yet.
export function getOrCreateSessionId(): string{
    let sessionId = localStorage.getItem(SESSION_ID);

    if(!sessionId){
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_ID, sessionId);
    }
    return sessionId;
}