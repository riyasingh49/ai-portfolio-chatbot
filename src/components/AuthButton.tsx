'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { signOut } from '@/lib/auth';
import { SignInDialog } from './SignInDialog';

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    setEmail(user?.email ?? null);
  }, []);

  useEffect(() => {
    checkUser();

    const { data: listener } = supabaseClient.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [checkUser]);

  const handleSignOut = async () => {
    await signOut();
    setEmail(null);
  };

  const handleSignInSuccess = () => {
    setShowDialog(false);
    checkUser();
  };

  if (email) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{email}</span>
        <button
          onClick={handleSignOut}
          className="text-sm border px-3 py-1.5 rounded bg-blue-500"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDialog(!showDialog)}
        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded"
      >
        Sign In
      </button>

      {showDialog && (
        <div className="absolute right-0 mt-2 w-72 z-10 bg-white shadow-lg">
          <SignInDialog onSuccess={handleSignInSuccess} />
        </div>
      )}
    </div>
  );
}