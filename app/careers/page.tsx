import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Briefcase, LayoutGrid, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  APPLICATION_DEADLINE,
  DEPARTMENTS,
  EMPLOYMENT_TYPE,
  GENERAL_NOTE,
  TOTAL_DEPARTMENTS,
  TOTAL_POSITIONS,
  TOTAL_TITLES,
  departmentPositions,
  jobsByDepartment,
} from '@/lib/careers'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Phase One recruitment at NJS Royale Beach Resort. Full-time restaurant, kitchen and administration roles supporting Yahweh Heights and Voyage Restaurant in Ibeju-Lekki, Lagos. Apply by October 31, 2026.',
  alternates: { canonical: '/careers' },
  openGraph: {
    title: 'Careers at NJS Royale Beach Resort',
    description:
      'Phase One Recruitment Vacancies — full-time roles across restaurant, kitchen and administration. Apply by October 31, 2026.',
    url: '/careers',
  },
}

const stats = [
  { icon: Briefcase, value: TOTAL_TITLES, label: 'Job titles' },
  { icon: Users, value: TOTAL_POSITIONS, label: 'Available positions' },
  { icon: LayoutGrid, value: TOTAL_DEPARTMENTS, label: 'Departments' },
]

export default function CareersPage() {
  return (
    <main className="bg-navy min-h-screen">
      <Navbar />

      {/* Hero band */}
      <header className="relative overflow-hidden border-b border-white/10 px-6 sm:px-10 pt-32 sm:pt-40 pb-14 sm:pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(70% 60% at 50% 0%, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0) 60%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-gold text-[11px] sm:text-xs uppercase tracking-[4px] mb-4 font-[family-name:var(--font-inter)]">
            Join the Team
          </p>
          <h1
            className="font-[family-name:var(--font-cormorant)] text-white leading-[1.05] text-balance"
            style={{ fontSize: 'clamp(38px, 6vw, 66px)' }}
          >
            Careers at NJS Royale
          </h1>
          <p className="mt-3 font-[family-name:var(--font-cormorant)] italic text-gold text-2xl sm:text-3xl">
            Phase One Recruitment Vacancies
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-white/70 text-[15px] sm:text-base leading-relaxed font-[family-name:var(--font-inter)]">
            We are recruiting full-time team members to support{' '}
            <span className="text-white">Yahweh Heights and Voyage Restaurant</span> as NJS Royale
            Beach Resort opens its Phase One on December 12, 2026, at Ibeju-Lekki, Lagos.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-[13px] sm:text-sm text-white font-[family-name:var(--font-inter)]">
            Application deadline:{' '}
            <span className="font-semibold text-gold">{APPLICATION_DEADLINE}</span>
          </p>

          {/* Data-driven summary */}
          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-5 sm:px-4 sm:py-6"
              >
                <Icon
                  aria-hidden="true"
                  className="mx-auto mb-2 h-5 w-5 text-gold"
                  strokeWidth={1.5}
                />
                <dd className="font-[family-name:var(--font-cormorant)] text-gold text-3xl sm:text-4xl leading-none">
                  {value}
                </dd>
                <dt className="mt-1.5 text-white/60 text-[10px] sm:text-[11px] uppercase tracking-[1.5px] font-[family-name:var(--font-inter)]">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Vacancies grouped by department */}
      <div className="mx-auto max-w-6xl px-6 sm:px-8 py-14 sm:py-20">
        {DEPARTMENTS.map((dept) => {
          const jobs = jobsByDepartment(dept.id)
          return (
            <section key={dept.id} aria-labelledby={`dept-${dept.id}`} className="mb-14 sm:mb-20 last:mb-0">
              <div className="mb-7 border-l-2 border-gold pl-4">
                <h2
                  id={`dept-${dept.id}`}
                  className="font-[family-name:var(--font-cormorant)] text-white text-3xl sm:text-4xl leading-tight"
                >
                  {dept.name}
                </h2>
                <p className="mt-1.5 text-white/55 text-sm max-w-2xl font-[family-name:var(--font-inter)]">
                  {dept.blurb}
                </p>
                <p className="mt-2 text-gold text-[11px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
                  {jobs.length} {jobs.length === 1 ? 'role' : 'roles'} · {departmentPositions(dept.id)}{' '}
                  {departmentPositions(dept.id) === 1 ? 'position' : 'positions'}
                </p>
              </div>

              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((jobItem) => (
                  <li key={jobItem.slug} className="h-full">
                    <div className="group flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-gold/40 focus-within:border-gold/40">
                      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[1.5px] text-white/50 font-[family-name:var(--font-inter)]">
                        <span>{dept.name}</span>
                        <span aria-hidden="true" className="text-white/25">·</span>
                        <span className="text-gold">{EMPLOYMENT_TYPE}</span>
                      </div>

                      <h3 className="font-[family-name:var(--font-cormorant)] text-white text-2xl leading-snug break-words">
                        {jobItem.title}
                      </h3>

                      <p className="mt-1.5 text-[12px] text-white/70 font-[family-name:var(--font-inter)]">
                        {jobItem.positions}{' '}
                        {jobItem.positions === 1 ? 'position available' : 'positions available'}
                      </p>

                      <p className="mt-3 flex-1 text-white/65 text-sm leading-relaxed font-[family-name:var(--font-inter)]">
                        {jobItem.summary}
                      </p>

                      <Link
                        href={`/careers/${jobItem.slug}`}
                        className="mt-5 inline-flex min-h-[44px] items-center gap-2 self-start rounded-md text-gold text-[12px] uppercase tracking-[1.5px] font-medium transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy font-[family-name:var(--font-inter)]"
                      >
                        View Details
                        <ArrowRight
                          aria-hidden="true"
                          className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
                          strokeWidth={1.75}
                        />
                        <span className="sr-only">for {jobItem.title}</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {/* General note */}
        <aside className="mt-4 rounded-xl border border-gold/25 bg-gold/[0.06] p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-cormorant)] text-white text-xl mb-2">
            A note to every applicant
          </h2>
          <p className="text-white/75 text-[15px] leading-relaxed font-[family-name:var(--font-inter)]">
            {GENERAL_NOTE}
          </p>
        </aside>
      </div>

      <Footer />
    </main>
  )
}
