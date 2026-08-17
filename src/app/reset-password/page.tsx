'use client';

import { useState } from 'react';
import { updatePassword } from '@/lib/auth';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    const { error } = await updatePassword(password);

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Password updated! You can now sign in with your new password.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-sm w-full space-y-3 p-4">
        <p className="font-medium">Set a new password</p>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {status === 'error' && <p className="text-red-600 text-sm">{errorMsg}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Update Password
        </button>
      </div>
    </main>
  );
}