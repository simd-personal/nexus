import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import './globals.css';
import { APP_DOMAIN, APP_NAME, BRAND_TAGLINE } from '@/lib/constants';
import { getSiteUrl } from '@/lib/marketing/seo';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeRouteSync } from '@/components/theme/ThemeRouteSync';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme/preferences';

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <Script id="upperdeck-theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP_SCRIPT}
        </Script>
        <ThemeProvider>
          <ThemeRouteSync />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
