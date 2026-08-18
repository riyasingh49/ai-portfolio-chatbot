'use server';

import {
  getConversationsForUser,
  createNewConversationForUser,
} from '@/db/conversations';
import { getFullConversationHistory } from '@/db/messages';

// Lists all conversations for the logged-in user, for the sidebar.
export async function listMyConversationsAction(userId: string) {
  const conversations = await getConversationsForUser(userId);
  return conversations;
}

// Creates a brand new conversation thread — used by the "New Chat" button.
export async function startNewConversationAction(userId: string) {
  const conversationId = await createNewConversationForUser(userId);
  return conversationId;
}

// Fetches the full message history for a specific conversation —
// used when the person clicks a conversation in the sidebar to switch to it.
export async function loadConversationAction(conversationId: string) {
  const history = await getFullConversationHistory(conversationId);
  return history;
}