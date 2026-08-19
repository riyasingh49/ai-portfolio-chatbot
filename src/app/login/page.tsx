import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/auth-form';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-sm space-y-6 border-gray-200 border-[1px] p-12 rounded-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in to continue chatting.</p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase text-gray-400">Or continue with email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-blue-600">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}