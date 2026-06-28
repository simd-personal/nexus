import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingNav } from '@/components/marketing/MarketingNav';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-page">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
