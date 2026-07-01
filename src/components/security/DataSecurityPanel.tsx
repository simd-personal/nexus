import Link from 'next/link';
import { Lock, Shield, ShieldCheck } from 'lucide-react';
import {
  DATA_SECURITY_ALL_USERS,
  DATA_SECURITY_ENTERPRISE_ADDITIONS,
  DATA_SECURITY_PRO_ADDITIONS,
  type DataSecurityBadge,
  type DataSecuritySection,
} from '@upperdeck/shared/data-security';
import { cn } from '@/lib/utils';

type DataSecurityPanelProps = {
  variant?: 'full' | 'compact' | 'upload';
  isPro?: boolean;
  isEnterprise?: boolean;
  className?: string;
};

function SecurityBadge({ badge }: { badge: DataSecurityBadge }) {
  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden />
        <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">{badge.label}</p>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-200/80">
        {badge.detail}
      </p>
    </div>
  );
}

function SectionBlock({
  section,
  compact,
}: {
  section: DataSecuritySection;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {!compact ? (
        <>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{section.intro}</p>
        </>
      ) : null}

      {section.badges.length > 0 ? (
        <div className={cn('grid gap-2', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4')}>
          {section.badges.map((badge) => (
            <SecurityBadge key={badge.id} badge={badge} />
          ))}
        </div>
      ) : null}

      {!compact ? (
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.commitment && !compact ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          {section.commitment}
        </p>
      ) : null}
    </div>
  );
}

export function DataSecurityPanel({
  variant = 'full',
  isPro = false,
  isEnterprise = false,
  className,
}: DataSecurityPanelProps) {
  const compact = variant === 'compact' || variant === 'upload';
  const sections: DataSecuritySection[] = [DATA_SECURITY_ALL_USERS];
  if (isPro && !isEnterprise) sections.push(DATA_SECURITY_PRO_ADDITIONS);
  if (isEnterprise) sections.push(DATA_SECURITY_ENTERPRISE_ADDITIONS);

  if (variant === 'upload') {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-[var(--ud-mist)] dark:to-[var(--ud-mist)]',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
            <Lock className="h-5 w-5 text-emerald-700 dark:text-emerald-300" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Your files stay private to this project
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                Uploads go to encrypted private storage, isolated to your account. Sunny only reads
                them to answer your questions, not to train models.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {DATA_SECURITY_ALL_USERS.badges.map((badge) => (
                <SecurityBadge key={badge.id} badge={badge} />
              ))}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              <Link href="/privacy#data-storage" className="underline underline-offset-2">
                Read our full data storage policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
          <Shield className="h-5 w-5 text-emerald-700 dark:text-emerald-300" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {compact ? 'Secure file storage' : 'Data security & file storage'}
          </h2>
          {!compact ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              What happens to client documents you upload, for every account tier.
            </p>
          ) : null}
        </div>
      </div>

      {compact ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {DATA_SECURITY_ALL_USERS.badges.map((badge) => (
              <SecurityBadge key={badge.id} badge={badge} />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{DATA_SECURITY_ALL_USERS.commitment}</p>
        </>
      ) : (
        sections.map((section) => <SectionBlock key={section.title} section={section} />)
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Details in our{' '}
        <Link href="/privacy#data-storage" className="text-gray-700 underline dark:text-gray-200">
          Privacy policy
        </Link>
        {isEnterprise ? (
          <>
            {' '}
            · Enterprise teams can request a data handling summary via{' '}
            <Link href="/request-quote" className="text-gray-700 underline dark:text-gray-200">
              Request a quote
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
