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

export function useChat() {
  const [messages, setMessages] = useState<chatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeGuestConversationId, setActiveGuestConversationId] = useState<string | null>(null);

  const refreshConversationList = useCallback(async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const list = await listMyConversationsAction(user.id);
    setConversations(list);

    if (!activeConversationId && list.length > 0) {
      setActiveConversationId(list[0].id);
      const history = await loadConversationAction(list[0].id);
      setMessages(history ?? []);
    }
  }, [activeConversationId]);

  useEffect(() => {
    refreshConversationList();
  }, [refreshConversationList]);

  const switchConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    const history = await loadConversationAction(conversationId);
    setMessages(history ?? []);
  }, []);

  const startNewChat = useCallback(async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      const newId = await startNewGuestConversationAction(getOrCreateSessionId());
      setActiveGuestConversationId(newId);
      setMessages([]);
      setGuestLimitReached(false);
      return;
    }

    const newId = await startNewConversationAction(user.id);
    setActiveConversationId(newId);
    setMessages([]);
    await refreshConversationList();
  }, [refreshConversationList]);

  const deleteChat = useCallback(async (conversationId: string) => {
    await deleteConversationAction(conversationId);

    if (conversationId === activeConversationId) {
      setMessages([]);
      setActiveConversationId(null);
    }

    await refreshConversationList();
  }, [activeConversationId, refreshConversationList]);

  // Clears the email draft attached to one specific message, by index —
  // used by that message's "Discard" button. Since drafts now live on
  // the message itself, clearing one never affects any other message.
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

    const sessionId = getOrCreateSessionId();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const isAuthenticated = !!user;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        question,
        isAuthenticated,
        conversationId: isAuthenticated
          ? activeConversationId
          : activeGuestConversationId,
        userId: user?.id ?? null,
      }),
    });

    if (response.status === 403) {
      setGuestLimitReached(true);
      setIsLoading(false);
      return;
    }

    if (!response.body) {
      setIsLoading(false);
      return;
    }

    const newConversationId = response.headers.get('X-Conversation-Id');
    if (newConversationId) {
      if (isAuthenticated && newConversationId !== activeConversationId) {
        setActiveConversationId(newConversationId);
      }

      if (!isAuthenticated && newConversationId !== activeGuestConversationId) {
        setActiveGuestConversationId(newConversationId);
      }
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let markerFound = false;
    let draftJson = '';

    const appendToAssistant = (content: string) => {
      if (!content) return;

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
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
        draftJson = buffer.slice(markerIndex + EMAIL_DRAFT_MARKER.length);
        buffer = '';
        return;
      }

      // While the stream is still open, retain only enough text to detect a
      // marker that may span two network chunks. Once it has ended, this
      // remaining text is normal answer content and must be displayed.
      const flushLength = isFinalChunk
        ? buffer.length
        : Math.max(0, buffer.length - EMAIL_DRAFT_MARKER.length);
      appendToAssistant(buffer.slice(0, flushLength));
      buffer = buffer.slice(flushLength);
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Flush TextDecoder's internal state, then display the marker-sized
        // tail retained by processBuffer. Previously this tail was never
        // rendered, truncating every normal streamed response.
        buffer += decoder.decode();
        processBuffer(true);

        // Stream finished — if a draft was being collected, attach it
        // to the assistant message we've been building, not to any
        // separate global state, so it stays anchored to this exact turn.
        if (markerFound && draftJson) {
          try {
            const draft = JSON.parse(draftJson);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, emailDraft: draft };
              return updated;
            });
          } catch {
            // Malformed draft JSON — ignore rather than crash the UI.
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      processBuffer();
    }

    setIsLoading(false);

    if (isAuthenticated) {
      await refreshConversationList();
    }
  }, [activeConversationId, activeGuestConversationId, refreshConversationList]);

  const onSignedIn = useCallback(async () => {
    setGuestLimitReached(false);
    await refreshConversationList();
  }, [refreshConversationList]);

  return {
    messages,
    sendMessage,
    isLoading,
    guestLimitReached,
    onSignedIn,
    conversations,
    activeConversationId,
    switchConversation,
    startNewChat,
    deleteChat,
    clearEmailDraft,
  };
}
