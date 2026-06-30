'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { useProductTour } from '@/components/tour/ProductTourProvider';
import { startProductTourFromSettings } from '@/lib/actions/tour';

export function ProductTourSettingsCard() {
  const router = useRouter();
  const { startTour } = useProductTour();
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  function handleStart() {
    setMessage('');
    startTransition(async () => {
      const result = await startProductTourFromSettings();
      if ('error' in result) {
        setMessage(result.error);
        return;
      }
      router.refresh();
      startTour();
    });
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Product tour"
        description="Quick walkthrough of projects, files, and Sunny tips — start anytime"
      />
      <Button onClick={handleStart} loading={pending} size="sm" className="gap-2">
        <SunnyAvatar size="xs" />
        Give me a tour
      </Button>
      {message && (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
      )}
    </Card>
  );
}
