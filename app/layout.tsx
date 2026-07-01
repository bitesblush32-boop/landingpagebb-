import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '600'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://blushbite.live'),

  title: {
    default: 'Apply as a Companion — BlushBite',
    template: '%s | BlushBite',
  },

  description:
    'Join BlushBite — the premium companion platform trusted by escorts across Europe. Apply today, build your private stage, and reach the clients you deserve. EU-hosted · GDPR compliant · Verified clients only.',

  keywords: [
    'companion platform apply',
    'become a companion online',
    'escort platform Europe',
    'premium companion platform',
    'apply as escort companion',
    'companion registration platform',
    'escort platform Netherlands',
    'escort platform UK',
    'escort platform Germany',
    'join escort platform',
    'private companion platform',
    'verified companion platform',
    'adult companion site apply',
    'BlushBite',
    'BlushBite companion',
    'BlushBite apply',
    'escort platform for professionals',
    'companion application online',
    'EU adult companion platform',
    'GDPR companion platform',
  ],

  authors: [{ name: 'BlushBite', url: 'https://blushbite.live' }],
  creator: 'BlushBite',
  publisher: 'BlushBite',
  category: 'Adult Entertainment',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  alternates: {
    canonical: 'https://blushbite.live',
  },

  openGraph: {
    type: 'website',
    url: 'https://blushbite.live',
    siteName: 'BlushBite',
    title: 'Apply as a Companion — BlushBite',
    description:
      "Join Europe's most sophisticated companion platform. Your profile. Your story. Your clients. EU-hosted · Verified · Private.",
    locale: 'en_GB',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BlushBite — Apply as a Companion',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Apply as a Companion — BlushBite',
    description:
      "Join Europe's premium companion platform. Your stage. Your clients. Your terms. Apply now.",
    images: ['/og-image.png'],
  },

  icons: {
    icon: [
      { url: '/favicon.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
  },

  other: {
    rating: 'adult',
    'RTA-label': 'RTA-5042-1996-1400-1577-RTA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
