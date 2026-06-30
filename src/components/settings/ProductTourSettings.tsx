'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { startProductTourFromSettings } from '@/lib/actions/tour';

export function ProductTourSettingsCard() {
  const router = useRouter();
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
      setMessage('Tour restarted — look for Sunny.');
      router.refresh();
      window.dispatchEvent(new CustomEvent('product-tour-restart'));
    });
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Product tour"
        description="Replay the quick walkthrough of UpperDeck features and Sunny tips"
      />
      <Button onClick={handleStart} loading={pending} size="sm">
        Give me a tour
      </Button>
      {message && (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
      )}
    </Card>
  );
}
