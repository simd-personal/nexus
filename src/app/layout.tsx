import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { APP_DOMAIN, APP_NAME, BRAND_TAGLINE } from '@/lib/constants';
import { getSiteUrl } from '@/lib/marketing/seo';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${APP_NAME} | ${BRAND_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Your first AI employee for client work. Sunny delivers briefs and client intelligence.',
  keywords: [
    'first AI employee',
    'AI employee software',
    'client intelligence',
    'consultant software',
    'AI client briefs',
    APP_DOMAIN,
  ],
  icons: { icon: '/upperdeck-icon.svg', apple: '/upperdeck-icon.svg' },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
