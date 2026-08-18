import {
  getOrCreateSession,
  getOrCreateConversationForUser,
  countMessagesForSession,
  updateConversationTitle,
} from '@/db/conversations';
import { getRecentMessage, saveMessage } from '@/db/messages';
import { getChatResponseStream } from '@/lib/chat';

const GUEST_MESSAGE_LIMIT = 2;

export async function POST(request: Request) {
  const { sessionId, question, isAuthenticated, conversationId, userId } = await request.json();

  if (!isAuthenticated) {
    const messageCount = await countMessagesForSession(sessionId);
    if (messageCount >= GUEST_MESSAGE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'GUEST_LIMIT_REACHED' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  let resolvedConversationId: string;

  if (isAuthenticated) {
    resolvedConversationId = conversationId ?? (await getOrCreateConversationForUser(userId));
  } else {
    resolvedConversationId = await getOrCreateSession(sessionId);
  }

  const recentHistory = await getRecentMessage(resolvedConversationId);
  const isFirstMessage = recentHistory.length === 0;

  let fullAnswer = '';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for await (const chunk of getChatResponseStream(question, recentHistory)) {
        fullAnswer += chunk;
        controller.enqueue(encoder.encode(chunk));
      }

      await saveMessage(resolvedConversationId, question, fullAnswer);

      if (isAuthenticated && isFirstMessage) {
        const title = question.length > 40 ? question.slice(0, 40) + '...' : question;
        await updateConversationTitle(resolvedConversationId, title);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Conversation-Id': resolvedConversationId,
    },
  });
}