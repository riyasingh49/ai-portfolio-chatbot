// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// // import { requestPasswordReset } from '@/lib/auth';

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState('');
//   const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
//   const [errorMsg, setErrorMsg] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async () => {
//     setErrorMsg('');
//     setIsSubmitting(true);

//     const { error } = await requestPasswordReset(email);

//     setIsSubmitting(false);

//     if (error) {
//       setStatus('error');
//       setErrorMsg(error.message);
//       return;
//     }

//     setStatus('sent');
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       handleSubmit();
//     }
//   };

//   if (status === 'sent') {
//     return (
//       <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
//         <div className="w-full max-w-sm text-center space-y-3">
//           <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
//           <p className="text-sm text-gray-500">
//             If an account exists for {email}, we&apos;ve sent a link to reset your password.
//           </p>
//           <Link href="/login" className="inline-block text-sm text-blue-600 font-medium">
//             Back to sign in
//           </Link>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
//       <div className="w-full max-w-sm space-y-6">
//         <div className="space-y-2 text-center">
//           <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reset your password</h1>
//           <p className="text-sm text-gray-500">
//             Enter your email and we&apos;ll send you a reset link.
//           </p>
//         </div>

//         <div className="space-y-3">
//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             onKeyDown={handleKeyDown}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
//           />

//           {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

//           <button
//             onClick={handleSubmit}
//             disabled={isSubmitting || !email}
//             className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
//           >
//             {isSubmitting ? 'Sending...' : 'Send Reset Link'}
//           </button>
//         </div>

//         <p className="text-center text-sm text-gray-500">
//           <Link href="/login" className="font-medium text-blue-600">
//             Back to sign in
//           </Link>
//         </p>
//       </div>
//     </main>
//   );
// }