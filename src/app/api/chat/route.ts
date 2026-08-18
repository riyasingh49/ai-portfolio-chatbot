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
  try {
    const {
      sessionId,
      question,
      isAuthenticated,
      conversationId,
      userId,
    } = await request.json();

    // -----------------------------------------
    // Validate request
    // -----------------------------------------

    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'QUESTION_REQUIRED',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'SESSION_ID_REQUIRED',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // -----------------------------------------
    // Guest message limit
    // -----------------------------------------

    if (!isAuthenticated) {
      const messageCount =
        await countMessagesForSession(sessionId);

      if (messageCount >= GUEST_MESSAGE_LIMIT) {
        return new Response(
          JSON.stringify({
            error: 'GUEST_LIMIT_REACHED',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // -----------------------------------------
    // Resolve conversation
    // -----------------------------------------

    let resolvedConversationId: string;

    if (isAuthenticated) {
      if (!userId) {
        return new Response(
          JSON.stringify({
            error: 'USER_ID_REQUIRED',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      resolvedConversationId =
        conversationId ??
        (await getOrCreateConversationForUser(userId));
    } else {
      resolvedConversationId =
        await getOrCreateSession(sessionId);
    }

    // -----------------------------------------
    // Get recent conversation history
    // -----------------------------------------

    const recentHistory =
      await getRecentMessage(
        resolvedConversationId
      );

    const isFirstMessage =
      recentHistory.length === 0;

    // -----------------------------------------
    // Full answer accumulator
    // -----------------------------------------

    let fullAnswer = '';

    // -----------------------------------------
    // Create streaming response
    // -----------------------------------------

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (
            const chunk of getChatResponseStream(
              question,
              recentHistory
            )
          ) {
            fullAnswer += chunk;

            controller.enqueue(
              encoder.encode(chunk)
            );
          }

          // -----------------------------------------
          // Save message
          // -----------------------------------------

          await saveMessage(
            resolvedConversationId,
            question,
            fullAnswer
          );

          // -----------------------------------------
          // Generate title for first message
          // -----------------------------------------

          if (
            isAuthenticated &&
            isFirstMessage
          ) {
            const title =
              question.length > 40
                ? question.slice(0, 40) + '...'
                : question;

            await updateConversationTitle(
              resolvedConversationId,
              title
            );
          }

          controller.close();
        } catch (error) {
          console.error('Chat stream error:', error);

          controller.error(error);
        }
      },
    });

    // -----------------------------------------
    // Return streaming response
    // -----------------------------------------

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type':
          'text/plain; charset=utf-8',

        'Cache-Control':
          'no-cache, no-transform',

        'X-Conversation-Id':
          resolvedConversationId,

        'X-Accel-Buffering':
          'no',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return new Response(
      JSON.stringify({
        error: 'CHAT_REQUEST_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type':
            'application/json',
        },
      }
    );
  }
}