import { redirect } from 'next/navigation';
import { HomePage } from '@/components/marketing/HomePage';
import { createMarketingMetadata } from '@/lib/marketing/seo';
import { createClient } from '@/lib/supabase/server';

export const metadata = createMarketingMetadata({
  title: 'UpperDeck',
  description:
    'AI command center for client intelligence. Upload meetings, emails, decks, and notes — Sunny surfaces briefs, risks, and follow-ups in one place.',
  path: '/',
  keywords: [
    'client intelligence software',
    'consultant project management',
    'AI client briefs',
    'client command center',
    'UpperDeck',
  ],
});

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return <HomePage />;
}
