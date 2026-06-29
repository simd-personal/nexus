import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AnnouncementBar() {
  return (
    <Link href="/product" className="anbar group">
      <span className="anbar-pill">
        <Sparkles className="h-3.5 w-3.5" /> New
      </span>
      <span className="anbar-text">
        Sunny now drafts decks &amp; playbooks from your client files
      </span>
      <ArrowRight className="anbar-arrow h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
