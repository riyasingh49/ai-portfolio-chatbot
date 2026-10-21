import {
  getOrCreateSession,
  getGuestConversationForSession,
  getOrCreateConversationForUser,
  getUserConversation,
  countMessagesForSession,
  updateConversationTitle,
} from '@/db/conversations';

import { getRecentMessage, saveMessage } from '@/db/messages';
import { getChatResponseStream } from '@/lib/chat';
import { getUserIdFromAccessToken } from '@/lib/server-auth';

const GUEST_MESSAGE_LIMIT = 10;

// Prefix used to mark an email-draft payload inside the otherwise plain-text
// stream, so the frontend can tell "this chunk is a draft" apart from
// normal streamed answer text.
const EMAIL_DRAFT_MARKER = '__EMAIL_DRAFT__:';

export async function POST(request: Request) {
  try {
    const {
      sessionId,
      question,
      conversationId,
    } = await request.json();

    const authorization = request.headers.get('authorization');
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const authenticatedUserId = accessToken
      ? await getUserIdFromAccessToken(accessToken)
      : null;

    if (authorization && !authenticatedUserId) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

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

    if (!authenticatedUserId) {
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

    if (authenticatedUserId) {
      if (conversationId) {
        const ownedConversationId = await getUserConversation(
          conversationId,
          authenticatedUserId
        );

        if (!ownedConversationId) {
          return Response.json(
            { error: 'CONVERSATION_NOT_FOUND' },
            { status: 404 }
          );
        }

        resolvedConversationId = ownedConversationId;
      } else {
        resolvedConversationId = await getOrCreateConversationForUser(
          authenticatedUserId
        );
      }
    } else {
      const guestConversationId =
        conversationId
          ? await getGuestConversationForSession(conversationId, sessionId)
          : await getOrCreateSession(sessionId);

      if (!guestConversationId) {
        return new Response(
          JSON.stringify({ error: 'GUEST_CONVERSATION_NOT_FOUND' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      resolvedConversationId = guestConversationId;
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
    // Accumulators
    // -----------------------------------------

    // Accumulates normal streamed text, used to save the message
    // to the database once the stream finishes.
    let fullText = '';

    // Tracks whether this response turned out to be an email draft
    // instead of a normal answer, so we save a short placeholder
    // to the messages table rather than raw draft JSON.
    let emailDraftSent = false;

    // -----------------------------------------
    // Create streaming response
    // -----------------------------------------

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // getChatResponseStream now yields typed events instead of
          // plain strings: either { type: 'content', text } for normal
          // answer chunks, or a single { type: 'email_draft', draft }
          // if the model called the draft_email tool instead of
          // answering in plain text.
          for await (
            const event of getChatResponseStream(
              question,
              recentHistory
            )
          ) {
            if (event.type === 'content') {
              fullText += event.text;

              controller.enqueue(
                encoder.encode(event.text)
              );
            }

            if (event.type === 'email_draft') {
              emailDraftSent = true;

              // Send the draft as one marked chunk: the frontend
              // detects the EMAIL_DRAFT_MARKER prefix and parses
              // everything after it as JSON, instead of treating
              // it as visible chat text.
              const payload =
                EMAIL_DRAFT_MARKER +
                JSON.stringify(event.draft);

              controller.enqueue(
                encoder.encode(payload)
              );
            }
          }

          // -----------------------------------------
          // Save message
          // -----------------------------------------

          // If the model drafted an email, store a short placeholder
          // instead of raw draft JSON, so conversation history stays
          // human-readable if ever displayed.
          const savedText = emailDraftSent
            ? '[Drafted an email]'
            : fullText;

          await saveMessage(
            resolvedConversationId,
            question,
            savedText
          );

          // -----------------------------------------
          // Generate title for first message
          // -----------------------------------------

          if (isFirstMessage) {
            const title =
              question.length > 20
                ? question.slice(0, 20) + '...'
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
