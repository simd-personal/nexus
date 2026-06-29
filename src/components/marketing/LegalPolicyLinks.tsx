import { LEGAL_ENTITY_DESCRIPTION } from '@/lib/constants';
import Link from 'next/link';

type LegalPolicyLinksProps = {
  className?: string;
  linkClassName?: string;
};

export function LegalPolicyLinks({
  className = '',
  linkClassName = 'marketing-inline-link',
}: LegalPolicyLinksProps) {
  return (
    <p className={className}>
      <Link href="/privacy" className={linkClassName}>
        Privacy policy
      </Link>
      {' · '}
      <Link href="/terms" className={linkClassName}>
        Terms of service
      </Link>
    </p>
  );
}

export function SignUpLegalNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-[11px] leading-relaxed marketing-text-muted ${className}`}>
      {LEGAL_ENTITY_DESCRIPTION} By creating an account, you agree to our{' '}
      <Link href="/privacy" className="auth-link">
        Privacy policy
      </Link>{' '}
      and{' '}
      <Link href="/terms" className="auth-link">
        Terms of service
      </Link>
      . Subscriptions cancel the same day with no refunds. When you delete your account, all data
      is permanently removed. You are responsible for redacting sensitive information you upload.
    </p>
  );
}
