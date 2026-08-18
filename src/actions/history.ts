'use server';

import { getOrCreateConversationForUser } from '@/db/conversations';
import { getFullConversationHistory } from '@/db/messages';

export async function getMyHistoryAction(userId: string) {
  const conversationId = await getOrCreateConversationForUser(userId);
  const history = await getFullConversationHistory(conversationId);

  return history;
}