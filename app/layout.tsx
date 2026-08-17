import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

const SITE_URL = 'https://www.njsbeachresort.com'
const SITE_NAME = 'NJS Royale Beach Resort'
const DESCRIPTION =
  'A refined beach resort on the Atlantic coast at Ibeju-Lekki, Lagos. Our Daycation — beach, pools and rooftop — opens December 12, 2026, Thursday to Sunday. Accommodation opens progressively from February 2027, with the complete 262-key resort at Grand Opening in July 2027.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NJS Royale Beach Resort — Oceanfront Daycation & Resort, Ibeju-Lekki, Lagos',
    template: '%s | NJS Royale Beach Resort',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  keywords: [
    'NJS Royale Beach Resort',
    'beach resort Lagos',
    'daycation Lagos',
    'Ibeju-Lekki resort',
    'leisure park Lagos',
    'oceanfront resort Nigeria',
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'en_NG',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'NJS Royale Beach Resort — oceanfront daycation and resort, Ibeju-Lekki, Lagos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
}

const resortSchema = {
  '@context': 'https://schema.org',
  '@type': 'Resort',
  name: SITE_NAME,
  description: DESCRIPTION,
  url: SITE_URL,
  telephone: '+2347075334158',
  image: `${SITE_URL}/og.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Mosere-Kogo Village, via Eko Akete',
    addressLocality: 'Ibeju-Lekki',
    addressRegion: 'Lagos State',
    addressCountry: 'NG',
  },
  areaServed: 'Lagos, Nigeria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-[#0A1628] font-[family-name:var(--font-inter)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(resortSchema) }}
        />
        {children}
      </body>
    </html>
  )
}
