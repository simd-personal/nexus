import Link from 'next/link';
import { UPLOAD_SECURITY_TOOLTIP } from '@upperdeck/shared/data-security';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export function UploadSecurityTooltip() {
  return (
    <InfoTooltip label="How your uploads are secured">
      {UPLOAD_SECURITY_TOOLTIP}{' '}
      <Link
        href="/privacy#data-storage"
        className="font-medium text-gray-800 underline underline-offset-2 dark:text-gray-100"
      >
        Privacy policy
      </Link>
    </InfoTooltip>
  );
}
