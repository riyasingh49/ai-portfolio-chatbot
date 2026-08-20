import { Suspense } from 'react';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/auth-form';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-sm space-y-6 border rounded border-gray-200 p-12">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create an account</h1>
          <p className="text-sm text-gray-500">Sign up to start chatting.</p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase text-gray-400">Or continue with email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}