import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import './globals.css';
import { APP_DOMAIN, APP_NAME, BRAND_TAGLINE, META_DESCRIPTION } from '@/lib/constants';
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, OG_IMAGE_ALT } from '@/lib/marketing/seo';
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
  description: META_DESCRIPTION,
  keywords: [
    'AI employees',
    'AI employee software',
    'client intelligence',
    'consultant software',
    'AI client briefs',
    APP_DOMAIN,
  ],
  icons: {
    icon: [{ url: '/upperdeck-icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: APP_NAME,
    title: `${APP_NAME} | ${BRAND_TAGLINE}`,
    description: META_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} | ${BRAND_TAGLINE}`,
    description: META_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
