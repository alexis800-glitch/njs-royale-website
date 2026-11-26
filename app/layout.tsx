import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import ConsentProvider from '@/components/consent/ConsentProvider'
import ConsentBanner from '@/components/consent/ConsentBanner'
import MetaPixel from '@/components/meta/MetaPixel'
import { MAP_LINK_URL, RESORT_COORDINATES } from '@/lib/location'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo'

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

// The home page description is reused four times over — the meta description,
// the Open Graph description, the Twitter description and the Resort schema —
// so it is written once here and every surface stays in step.
//
// It is FRONT-LOADED rather than shortened. Google truncates a snippet at
// roughly 155 characters, and the previous wording spent its opening clause on
// "A refined beach resort on the Atlantic coast" before reaching the brand
// name, so the visible snippet stopped mid-sentence without ever saying when
// the resort opens. The brand, the location and the 19 December 2026 date now
// all fall inside the first 125 characters; the venues and the 23 July 2027
// date follow for the surfaces that show the whole string. Nothing was cut to
// hit a character count, and both approved dates are unchanged.
const DESCRIPTION =
  'NJS Royale Beach Resort is a refined oceanfront resort on the Atlantic coast at Ibeju-Lekki, Lagos, opening December 19, 2026. Come experience the resort before the rooms open, with Yahweh Heights, Voyage, Royale Horizon, the resort lounges, live entertainment and the private beach. Guest rooms and accommodation open on July 23, 2027.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // 58 characters, so it survives intact in a result; the previous 67-character
    // version was cut at "Ibeju-Lek…". Every term it carried is still here —
    // the brand, oceanfront, Ibeju-Lekki and Lagos — with only the connecting
    // words removed.
    default: 'NJS Royale Beach Resort | Oceanfront in Ibeju-Lekki, Lagos',
    template: '%s | NJS Royale Beach Resort',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  keywords: [
    'NJS Royale Beach Resort',
    'beach resort Lagos',
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
    images: [OG_IMAGE],
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
  email: 'info@njsbeachresort.com',
  image: `${SITE_URL}/og.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Mosere-Kogo Village, via Eko Akete',
    addressLocality: 'Ibeju-Lekki',
    addressRegion: 'Lagos State',
    addressCountry: 'NG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: RESORT_COORDINATES.latitude,
    longitude: RESORT_COORDINATES.longitude,
  },
  hasMap: MAP_LINK_URL,
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
        {/* Marketing consent gates the Meta Pixel: nothing Meta-related loads,
            and no Meta cookie is set, until the visitor accepts. */}
        <ConsentProvider>
          {children}
          <ConsentBanner />
          <MetaPixel />
        </ConsentProvider>
      </body>
    </html>
  )
}
