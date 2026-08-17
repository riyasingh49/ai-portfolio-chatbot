'use client';

import { useEffect, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { linkGuestSessionAction } from '@/actions/auth';
import { getOrCreateSessionId } from '@/lib/session';

export function useAuthListener(onSignedIn: () => void) {
  const hasLinkedRef = useRef(false);

  useEffect(() => {
    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !hasLinkedRef.current) {
          hasLinkedRef.current = true;

          const sessionId = getOrCreateSessionId();
          await linkGuestSessionAction(sessionId, session.user.id);

          onSignedIn();
        }

        if (event === 'SIGNED_OUT') {
          hasLinkedRef.current = false;
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [onSignedIn]);
}