import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--ud-stone)]">
          <span className="auth-spinner h-5 w-5 rounded-full border-2 border-[var(--ud-cloud)] border-t-[#7c6cf0]" />
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
