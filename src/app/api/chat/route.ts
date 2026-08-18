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
  console.log('========== CHAT API START ==========');

  try {
    const {
      sessionId,
      question,
      isAuthenticated,
      conversationId,
      userId,
    } = await request.json();

    console.log('Question:', question);
    console.log('Session ID:', sessionId);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Conversation ID:', conversationId);
    console.log('User ID:', userId);

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
      console.log('Checking guest message limit...');

      const messageCount =
        await countMessagesForSession(sessionId);

      console.log(
        'Guest message count:',
        messageCount
      );

      if (messageCount >= GUEST_MESSAGE_LIMIT) {
        console.log('Guest limit reached');

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
      console.log(
        'Resolving authenticated conversation...'
      );

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
      console.log(
        'Resolving guest conversation...'
      );

      resolvedConversationId =
        await getOrCreateSession(sessionId);
    }

    console.log(
      'Resolved conversation:',
      resolvedConversationId
    );

    // -----------------------------------------
    // Get recent conversation history
    // -----------------------------------------

    console.log(
      'Fetching recent conversation history...'
    );

    const recentHistory =
      await getRecentMessage(
        resolvedConversationId
      );

    console.log(
      'History messages:',
      recentHistory.length
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
          console.log(
            '========== STREAM START =========='
          );

          console.log(
            'Calling getChatResponseStream...'
          );

          for await (
            const chunk of getChatResponseStream(
              question,
              recentHistory
            )
          ) {
            console.log(
              'Received chunk:',
              chunk
            );

            fullAnswer += chunk;

            controller.enqueue(
              encoder.encode(chunk)
            );
          }

          console.log(
            '========== GROQ STREAM FINISHED =========='
          );

          console.log(
            'Full answer length:',
            fullAnswer.length
          );

          // -----------------------------------------
          // Save message
          // -----------------------------------------

          console.log(
            'Saving message...'
          );

          await saveMessage(
            resolvedConversationId,
            question,
            fullAnswer
          );

          console.log(
            'Message saved successfully'
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

            console.log(
              'Updating conversation title:',
              title
            );

            await updateConversationTitle(
              resolvedConversationId,
              title
            );

            console.log(
              'Conversation title updated'
            );
          }

          console.log(
            '========== STREAM COMPLETE =========='
          );

          controller.close();
        } catch (error) {
          console.error(
            '========== CHAT STREAM ERROR =========='
          );

          console.error(error);

          controller.error(error);
        }
      },
    });

    // -----------------------------------------
    // Return streaming response
    // -----------------------------------------

    console.log(
      'Returning streaming response'
    );

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
    // -----------------------------------------
    // API-level error
    // -----------------------------------------

    console.error(
      '========== CHAT API ERROR =========='
    );

    console.error(error);

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