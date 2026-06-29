import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-onboarding" aria-hidden>
          <div className="auth-onboarding-blob-a" />
          <div className="auth-onboarding-blob-b" />
          <div className="auth-onboarding-card">
            <div className="auth-onboarding-mark">
              <span className="auth-onboarding-ring" />
            </div>
          </div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
