'use client';

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/auth';

type SignInDialogProps = {
  onSuccess: () => void;
};

export function SignInDialog({ onSuccess }: SignInDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailAuth = async () => {
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

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
      onSuccess();
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    await signInWithGoogle(email, password);
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 text-fuchsia-800">
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

      {mode === 'signup' && (
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      )}

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

      <button onClick={switchMode} className="w-full text-sm text-blue-600">
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}