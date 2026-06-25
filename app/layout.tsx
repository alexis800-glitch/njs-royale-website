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

export const metadata: Metadata = {
  title: 'NJS Royale Beach Resort — Atlantic Oceanfront, Nigeria',
  description:
    'A 5-star Atlantic oceanfront resort in Nigeria. 300 ocean-facing rooms, rooftop pool, signature restaurants, private beach, and world-class spa.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-[#0A1628] font-[family-name:var(--font-inter)] antialiased">
        {children}
      </body>
    </html>
  )
}
