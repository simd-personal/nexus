import { redirect } from 'next/navigation';
import { HomePage } from '@/components/marketing/HomePage';
import { createMarketingMetadata } from '@/lib/marketing/seo';
import { createClient } from '@/lib/supabase/server';

export const metadata = createMarketingMetadata({
  title: 'UpperDeck',
  description:
    'Hire Sunny — your first AI employee for client work. Upload decks, emails, and meetings; get briefs and risks with citations. Latest GPT and Claude included. Gets more capable as we ship new features.',
  path: '/',
  keywords: [
    'first AI employee',
    'AI employee for consultants',
    'client intelligence software',
    'AI client briefs',
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
