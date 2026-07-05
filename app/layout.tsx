// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://globalledger.com'),
  title: {
    default: 'GlobalLedger – Finance Tools for Freelancers',
    template: '%s | GlobalLedger',
  },
  description: 'Multi-currency earnings tracking, professional invoices, tax estimator, and client management for freelancers worldwide.',
  keywords: [
    'freelancer finance',
    'multi-currency',
    'invoice generator',
    'tax estimator',
    'client management',
    'freelance tools',
    'freelancer earnings',
    'currency converter',
  ],
  authors: [{ name: 'GlobalLedger Team', url: 'https://globalledger.com' }],
  creator: 'GlobalLedger',
  publisher: 'GlobalLedger',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'GlobalLedger – Finance Tools for Freelancers',
    description: 'Track earnings, create invoices, estimate taxes – all in one platform.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://globalledger.com',
    siteName: 'GlobalLedger',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GlobalLedger – Finance Tools for Freelancers',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GlobalLedger – Finance Tools for Freelancers',
    description: 'Multi-currency tracking, invoices, tax tools for freelancers.',
    images: ['/twitter-image.jpg'],
    site: '@GlobalLedger',
    creator: '@GlobalLedger',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://globalledger.com',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  category: 'Finance',
  classification: 'Freelance Finance Management',
};

// ============================================================
// JSON-LD Structured Data (for better SEO)
// ============================================================
function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'GlobalLedger',
    description: 'Multi-currency earnings tracking, professional invoices, tax estimator, and client management for freelancers worldwide.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://globalledger.com',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '5',
      priceCurrency: 'USD',
      description: 'Freelancer Pro subscription',
    },
    author: {
      '@type': 'Organization',
      name: 'GlobalLedger Team',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* PWA / Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* JSON-LD Structured Data */}
        <JsonLd />
      </head>
      <body 
        className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}