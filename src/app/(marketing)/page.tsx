import { redirect } from 'next/navigation';
import { HomePage } from '@/components/marketing/HomePage';
import { createMarketingMetadata } from '@/lib/marketing/seo';
import { createClient } from '@/lib/supabase/server';

export const metadata = createMarketingMetadata({
  title: 'UpperDeck',
  description:
    'Client intelligence for consultants. Upload decks, emails, and meetings — Sunny surfaces briefs and risks with citations. Latest GPT and Claude included, no separate AI subscription.',
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
