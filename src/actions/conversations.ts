'use server';

import {
  getConversationsForUser,
  createNewConversationForUser,
  createNewConversationForGuestSession,
  deleteConversationForUser,
  getUserConversation,
} from '@/db/conversations';
import { getFullConversationHistory } from '@/db/messages';
import { getUserIdFromAccessToken } from '@/lib/server-auth';

async function requireUserId(accessToken: string) {
  const userId = await getUserIdFromAccessToken(accessToken);

  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }

  return userId;
}

// Lists all conversations for the logged-in user, for the sidebar.
export async function listMyConversationsAction(accessToken: string) {
  const userId = await requireUserId(accessToken);
  const conversations = await getConversationsForUser(userId);
  return conversations;
}

// Creates a brand new conversation thread — used by the "New Chat" button.
export async function startNewConversationAction(accessToken: string) {
  const userId = await requireUserId(accessToken);
  const conversationId = await createNewConversationForUser(userId);
  return conversationId;
}

// Starts a new thread while retaining the guest session used for limits and
// later account linking.
export async function startNewGuestConversationAction(sessionId: string) {
  return createNewConversationForGuestSession(sessionId);
}

// Fetches the full message history for a specific conversation —
// used when the person clicks a conversation in the sidebar to switch to it.
export async function loadConversationAction(conversationId: string, accessToken: string) {
  const userId = await requireUserId(accessToken);
  const ownedConversationId = await getUserConversation(conversationId, userId);

  if (!ownedConversationId) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  const history = await getFullConversationHistory(ownedConversationId);
  return history;
}

export async function deleteConversationAction(conversationId: string, accessToken: string) {
  const userId = await requireUserId(accessToken);
  const deleted = await deleteConversationForUser(conversationId, userId);

  if (!deleted) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  return { success: true };
}
