import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, Mail, MapPin, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  APPLICATION_DEADLINE,
  APPLICATION_DEADLINE_ISO,
  APPLY_EMAIL,
  CAREERS,
  CAREERS_LOCATION,
  EMPLOYMENT_TYPE,
  applyMailtoHref,
  getDepartment,
  getJob,
} from '@/lib/careers'

const SITE_URL = 'https://www.njsbeachresort.com'
const DATE_POSTED = '2026-09-19'

export function generateStaticParams() {
  return CAREERS.map((j) => ({ slug: j.slug }))
}

export const dynamicParams = false

type Params = { params: { slug: string } }

export function generateMetadata({ params }: Params): Metadata {
  const jobItem = getJob(params.slug)
  if (!jobItem) return { title: 'Vacancy not found' }
  const dept = getDepartment(jobItem.department)
  return {
    title: jobItem.title,
    description: `${jobItem.title} (${EMPLOYMENT_TYPE}) at NJS Royale Beach Resort, ${dept.name}. ${jobItem.summary} Apply by ${APPLICATION_DEADLINE}.`,
    alternates: { canonical: `/careers/${jobItem.slug}` },
    openGraph: {
      title: `${jobItem.title} — Careers at NJS Royale Beach Resort`,
      description: jobItem.summary,
      url: `/careers/${jobItem.slug}`,
    },
  }
}

export default function JobDetailPage({ params }: Params) {
  const jobItem = getJob(params.slug)
  if (!jobItem) notFound()

  const dept = getDepartment(jobItem.department)
  const positionsLabel = `${jobItem.positions} ${jobItem.positions === 1 ? 'position' : 'positions'}`

  const descriptionHtml =
    `<p>${jobItem.summary}</p>` +
    `<p><strong>Key responsibilities</strong></p><ul>` +
    jobItem.responsibilities.map((r) => `<li>${r}</li>`).join('') +
    `</ul><p><strong>Requirements</strong></p><ul>` +
    jobItem.requirements.map((r) => `<li>${r}</li>`).join('') +
    `</ul>`

  const jobPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: jobItem.title,
    description: descriptionHtml,
    datePosted: DATE_POSTED,
    validThrough: APPLICATION_DEADLINE_ISO,
    employmentType: 'FULL_TIME',
    directApply: false,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'NJS Royale Beach Resort',
      sameAs: SITE_URL,
      logo: `${SITE_URL}/njs-logos/njs-crest-mark.png`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Mosere-Kogo Village, via Eko Akete',
        addressLocality: 'Ibeju-Lekki',
        addressRegion: 'Lagos State',
        addressCountry: 'NG',
      },
    },
    totalJobOpenings: jobItem.positions,
    identifier: {
      '@type': 'PropertyValue',
      name: 'NJS Royale Beach Resort',
      value: jobItem.slug,
    },
    industry: 'Hospitality',
    applicantLocationRequirements: { '@type': 'Country', name: 'Nigeria' },
  }

  const meta = [
    { icon: Users, text: positionsLabel + ' available' },
    { icon: MapPin, text: CAREERS_LOCATION },
    { icon: CalendarClock, text: `Apply by ${APPLICATION_DEADLINE}` },
  ]

  return (
    <main className="bg-navy min-h-screen">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />

      {/* Hero */}
      <header className="border-b border-white/10 px-6 sm:px-10 pt-28 sm:pt-36 pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/careers"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md text-gold text-[11px] uppercase tracking-[2px] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            Back to Careers
          </Link>

          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[2px] text-white/55 font-[family-name:var(--font-inter)]">
            <span>{dept.name}</span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span className="text-gold">{EMPLOYMENT_TYPE}</span>
          </p>

          <h1
            className="mt-3 font-[family-name:var(--font-cormorant)] text-white leading-[1.08] text-balance break-words"
            style={{ fontSize: 'clamp(34px, 5.5vw, 56px)' }}
          >
            {jobItem.title}
          </h1>

          <ul className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {meta.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 text-white/70 text-sm font-[family-name:var(--font-inter)]"
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-6 sm:px-8 py-12 sm:py-16">
        <section aria-labelledby="role-summary">
          <h2
            id="role-summary"
            className="font-[family-name:var(--font-cormorant)] text-white text-2xl sm:text-3xl mb-3"
          >
            Role summary
          </h2>
          <p className="text-white/75 text-[16px] leading-relaxed font-[family-name:var(--font-inter)]">
            {jobItem.summary}
          </p>
        </section>

        <section aria-labelledby="responsibilities" className="mt-10">
          <h2
            id="responsibilities"
            className="font-[family-name:var(--font-cormorant)] text-white text-2xl sm:text-3xl mb-4"
          >
            Key responsibilities
          </h2>
          <ul className="space-y-3">
            {jobItem.responsibilities.map((item) => (
              <li key={item} className="flex gap-3 text-white/75 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="requirements" className="mt-10">
          <h2
            id="requirements"
            className="font-[family-name:var(--font-cormorant)] text-white text-2xl sm:text-3xl mb-4"
          >
            Requirements
          </h2>
          <ul className="space-y-3">
            {jobItem.requirements.map((item) => (
              <li key={item} className="flex gap-3 text-white/75 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Application panel */}
        <section
          aria-labelledby="how-to-apply"
          className="mt-12 rounded-xl border border-gold/25 bg-white/[0.03] p-6 sm:p-8"
        >
          <h2
            id="how-to-apply"
            className="font-[family-name:var(--font-cormorant)] text-white text-2xl sm:text-3xl mb-3"
          >
            How to apply
          </h2>
          <p className="text-white/75 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]">
            Email your CV to{' '}
            <a
              href={`mailto:${APPLY_EMAIL}`}
              className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-white transition-colors"
            >
              {APPLY_EMAIL}
            </a>{' '}
            using the position title as the email subject. In your email, include your full name,
            telephone number, current location and relevant years of experience. A cover letter is
            not required.
          </p>

          <a
            href={applyMailtoHref(jobItem.title)}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-gold px-7 text-navy text-[13px] uppercase tracking-[1.5px] font-semibold transition-colors duration-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
          >
            <Mail aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            Apply by Email
          </a>
          <p className="mt-3 text-white/45 text-[12px] leading-relaxed font-[family-name:var(--font-inter)]">
            This opens your email app with the subject “Application – {jobItem.title}” already filled
            in. Please attach your CV before sending.
          </p>
        </section>

        <div className="mt-12 border-t border-white/10 pt-8">
          <Link
            href="/careers"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md text-gold text-[12px] uppercase tracking-[1.5px] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            Back to all vacancies
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  )
}
