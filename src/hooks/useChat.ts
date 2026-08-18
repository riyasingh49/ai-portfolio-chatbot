'use client';

import { useState, useCallback, useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/session';
import { supabaseClient } from '@/lib/supabase-client';
import { getMyHistoryAction } from '@/actions/history';
import type { chatMessage } from '@/types/chat';

export function useChat() {
  const [messages, setMessages] = useState<chatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
      const history = await getMyHistoryAction(user.id);
      setMessages(history);
    }

    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const resetGuestLimit = useCallback(() => {
    setGuestLimitReached(false);
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
      body: JSON.stringify({ sessionId, question, isAuthenticated }),
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
  }, []);

  // Re-load history right after a successful login, so a guest's
  // history (now linked to their account) and any prior sessions merge in.
  const onSignedIn = useCallback(async () => {
    setGuestLimitReached(false);
    await loadHistory();
  }, [loadHistory]);

  return {
    messages,
    sendMessage,
    isLoading,
    guestLimitReached,
    resetGuestLimit,
    onSignedIn,
    historyLoaded,
  };
}