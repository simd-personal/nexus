import { OrganizationJsonLd, SoftwareApplicationJsonLd } from '@/components/marketing/JsonLd';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      {children}
    </>
  );
}
