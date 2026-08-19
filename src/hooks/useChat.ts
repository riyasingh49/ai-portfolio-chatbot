'use client';

import { useState, useCallback, useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/session';
import { supabaseClient } from '@/lib/supabase-client';
import {
  listMyConversationsAction,
  startNewConversationAction,
  loadConversationAction,
} from '@/actions/conversations';
import type { chatMessage } from '@/types/chat';
import { deleteConversationAction } from '@/actions/conversations';


type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
};

export function useChat() {
  const [messages, setMessages] = useState<chatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const refreshConversationList = useCallback(async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const list = await listMyConversationsAction(user.id);
    setConversations(list);

    // If nothing is active yet, default to the most recent conversation.
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
    if (!user) return;

    const newId = await startNewConversationAction(user.id);
    setActiveConversationId(newId);
    setMessages([]);
    await refreshConversationList();
  }, [refreshConversationList]);

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
        conversationId: isAuthenticated ? activeConversationId : null,
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
    if (isAuthenticated && newConversationId && newConversationId !== activeConversationId) {
      setActiveConversationId(newConversationId);
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, content: last.content + chunkText };
        return updated;
      });
    }

    setIsLoading(false);

    if (isAuthenticated) {
      await refreshConversationList();
    }
  }, [activeConversationId, refreshConversationList]);

  const onSignedIn = useCallback(async () => {
    setGuestLimitReached(false);
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
    deleteChat
  };
}