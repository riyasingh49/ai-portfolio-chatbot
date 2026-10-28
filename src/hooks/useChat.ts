'use client';

import { useState, useCallback, useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/session';
import { supabaseClient } from '@/lib/supabase-client';
import {
  listMyConversationsAction,
  startNewConversationAction,
  startNewGuestConversationAction,
  loadConversationAction,
  deleteConversationAction,
} from '@/actions/conversations';
import type { chatMessage } from '@/types/chat';

type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
};

const EMAIL_DRAFT_MARKER = '__EMAIL_DRAFT__:';

async function getAccessToken() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return session?.access_token ?? null;
}

export function useChat() {
  const [messages, setMessages] = useState<chatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeGuestConversationId, setActiveGuestConversationId] = useState<string | null>(null);
  const [activeGuestSessionId, setActiveGuestSessionId] = useState<string | null>(null);

  const refreshConversationList = useCallback(async () => {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const list = await listMyConversationsAction(accessToken);
    setConversations(list);

    if (!activeConversationId && list.length > 0) {
      setActiveConversationId(list[0].id);
      const history = await loadConversationAction(list[0].id, accessToken);
      setMessages(history ?? []);
    }
  }, [activeConversationId]);

  useEffect(() => {
    refreshConversationList();
  }, [refreshConversationList]);

  const switchConversation = useCallback(async (conversationId: string) => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setActiveConversationId(conversationId);
    const history = await loadConversationAction(conversationId, accessToken);
    setMessages(history ?? []);
  }, []);

  const startNewChat = useCallback(async () => {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      const sessionId = getOrCreateSessionId();
      const newId = await startNewGuestConversationAction(sessionId);

      setActiveGuestSessionId(sessionId);
      setActiveGuestConversationId(newId);
      setMessages([]);
      setGuestLimitReached(false);
      setRateLimitMessage(null);
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const newId = await startNewConversationAction(accessToken);
    setActiveConversationId(newId);
    setMessages([]);
    await refreshConversationList();
  }, [refreshConversationList]);

  const deleteChat = useCallback(async (conversationId: string) => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    await deleteConversationAction(conversationId, accessToken);

    if (conversationId === activeConversationId) {
      setMessages([]);
      setActiveConversationId(null);
    }

    await refreshConversationList();
  }, [activeConversationId, refreshConversationList]);

  const clearEmailDraft = useCallback((messageIndex: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      const { emailDraft, ...rest } = updated[messageIndex];
      updated[messageIndex] = rest;
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    setIsLoading(true);
    setGuestLimitReached(false);
    setRateLimitMessage(null);

    try {
      const sessionId = getOrCreateSessionId();
      const accessToken = await getAccessToken();
      const isAuthenticated = !!accessToken;

      // If localStorage contains a different guest session, do not send
      // the conversation ID belonging to the previous session.
      const guestConversationId =
        activeGuestSessionId === sessionId
          ? activeGuestConversationId
          : null;

      // Keep the session associated with the next guest conversation.
      if (!isAuthenticated && activeGuestSessionId !== sessionId) {
        setActiveGuestSessionId(sessionId);
        setActiveGuestConversationId(null);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: question },
      ]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          question,
          conversationId: isAuthenticated
            ? activeConversationId
            : guestConversationId,
        }),
      });

      if (response.status === 403) {
        setGuestLimitReached(true);
        return;
      }

      if (response.status === 429) {
        setRateLimitMessage(
          'You’re sending messages too quickly. Please wait a moment before trying again.'
        );
        return;
      }

      if (!response.ok) {
        console.error(
          'Chat request failed:',
          response.status,
          await response.text()
        );
        setRateLimitMessage('Unable to get a response. Please try again.');
        return;
      }

      if (!response.body) {
        setRateLimitMessage('The server returned an empty response. Please try again.');
        return;
      }

      const newConversationId = response.headers.get('X-Conversation-Id');

      if (newConversationId) {
        if (isAuthenticated && newConversationId !== activeConversationId) {
          setActiveConversationId(newConversationId);
        }

        if (!isAuthenticated) {
          setActiveGuestSessionId(sessionId);
          setActiveGuestConversationId(newConversationId);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '' },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let markerFound = false;
      let draftJson = '';

      const appendToAssistant = (content: string) => {
        if (!content) return;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          const last = updated[lastIndex];

          updated[lastIndex] = {
            ...last,
            content: last.content + content,
          };

          return updated;
        });
      };

      const processBuffer = (isFinalChunk = false) => {
        if (markerFound) {
          draftJson += buffer;
          buffer = '';
          return;
        }

        const markerIndex = buffer.indexOf(EMAIL_DRAFT_MARKER);

        if (markerIndex !== -1) {
          appendToAssistant(buffer.slice(0, markerIndex));
          markerFound = true;
          draftJson = buffer.slice(
            markerIndex + EMAIL_DRAFT_MARKER.length
          );
          buffer = '';
          return;
        }

        const flushLength = isFinalChunk
          ? buffer.length
          : Math.max(0, buffer.length - EMAIL_DRAFT_MARKER.length);

        appendToAssistant(buffer.slice(0, flushLength));
        buffer = buffer.slice(flushLength);
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          buffer += decoder.decode();
          processBuffer(true);

          if (markerFound && draftJson) {
            try {
              const draft = JSON.parse(draftJson);

              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                if (lastIndex >= 0) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    emailDraft: draft,
                  };
                }

                return updated;
              });
            } catch {
              // Ignore malformed email-draft JSON.
            }
          }

          break;
        }

        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }

      if (isAuthenticated) {
        await refreshConversationList();
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
      setRateLimitMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeConversationId,
    activeGuestConversationId,
    activeGuestSessionId,
    refreshConversationList,
  ]);

  const onSignedIn = useCallback(async () => {
    setGuestLimitReached(false);
    await refreshConversationList();
  }, [refreshConversationList]);

  return {
    messages,
    sendMessage,
    isLoading,
    guestLimitReached,
    rateLimitMessage,
    onSignedIn,
    conversations,
    activeConversationId,
    switchConversation,
    startNewChat,
    deleteChat,
    clearEmailDraft,
  };
}
