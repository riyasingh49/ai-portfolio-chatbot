import { getOrCreateSession, countMessagesForSession } from '@/db/conversations';
import { getRecentMessage, saveMessage } from '@/db/messages';
import { getChatResponseStream } from '@/lib/chat';

const GUEST_MESSAGE_LIMIT = 2;

export async function POST(request: Request) {
  const { sessionId, question, isAuthenticated } = await request.json();

  if (!isAuthenticated) {
    const messageCount = await countMessagesForSession(sessionId);

    if (messageCount >= GUEST_MESSAGE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'GUEST_LIMIT_REACHED' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const conversationId = await getOrCreateSession(sessionId);
  const recentHistory = await getRecentMessage(conversationId);

  let fullAnswer = '';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for await (const chunk of getChatResponseStream(question, recentHistory)) {
        fullAnswer += chunk;
        controller.enqueue(encoder.encode(chunk));
      }

      await saveMessage(conversationId, question, fullAnswer);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Conversation-Id': conversationId,
    },
  });
}