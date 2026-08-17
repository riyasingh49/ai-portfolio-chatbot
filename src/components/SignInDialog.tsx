'use client';

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/auth';
import { linkGuestSessionAction } from '@/actions/auth';
import { getOrCreateSessionId } from '@/lib/session';

type SignInDialogProps = {
  onSuccess: () => void;
};

export function SignInDialog({ onSuccess }: SignInDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const linkAndFinish = async (userId: string) => {
    const sessionId = getOrCreateSessionId();
    await linkGuestSessionAction(sessionId, userId);
    onSuccess();
  };

  const handleEmailAuth = async () => {
    setError('');
    setIsSubmitting(true);

    const { data, error: authError } =
      mode === 'signin'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data?.user) {
      await linkAndFinish(data.user.id);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    await signInWithGoogle(email, password);
    // Redirects away to Google — linking happens after redirect back,
    // handled separately via the auth state listener (next file).
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <p className="text-sm font-medium">
        {mode === 'signin' ? 'Sign in to continue' : 'Create an account to continue'}
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleEmailAuth}
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {mode === 'signin' ? 'Sign In' : 'Sign Up'}
      </button>

      <button
        onClick={handleGoogleAuth}
        className="w-full border py-2 rounded"
      >
        Continue with Google
      </button>

      <button
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="w-full text-sm text-blue-600"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}