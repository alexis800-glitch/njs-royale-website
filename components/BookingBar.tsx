'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const adultOptions   = ['1 Adult', '2 Adults', '3 Adults', '4 Adults', '5+ Adults']
const childOptions   = ['0 Children', '1 Child', '2 Children', '3 Children', '4+ Children']
const roomOptions    = ['All Room Types', 'Deluxe Ocean View', 'Junior Suite', 'Presidential 4-Bedroom Suite']
const viewOptions    = ['Any View', 'Ocean View', 'Garden View', 'Pool View']

const selectClass =
  'bg-[#0A1628] border border-gold/30 text-white/75 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors duration-300 font-[family-name:var(--font-inter)] w-full appearance-none cursor-pointer'

const inputClass =
  'bg-[#0A1628] border border-gold/30 text-white/75 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors duration-300 font-[family-name:var(--font-inter)] w-full'

const labelClass = 'text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]'

export default function BookingBar() {
  const [checkIn,  setCheckIn]  = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults,   setAdults]   = useState('2 Adults')
  const [children, setChildren] = useState('0 Children')
  const [roomType, setRoomType] = useState('All Room Types')
  const [viewPref, setViewPref] = useState('Any View')

  return (
    <section className="bg-[#060E1A] border-b border-gold/10 py-7 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <p className="text-gold/70 text-[10px] uppercase tracking-[2px] text-center mb-5 font-[family-name:var(--font-inter)]">
          Reservations Opening Soon — Register Your Interest Below
        </p>

        {/* Row 1 (lg): Check-in | Check-out | Adults | Children */}
        {/* Row 2 (lg): Room Type | View Preference | CTA (span 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">

          {/* Check-in */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={inputClass}
            />
          </div>

          {/* Check-out */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={inputClass}
            />
          </div>

          {/* Adults */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Adults</label>
            <select value={adults} onChange={(e) => setAdults(e.target.value)} className={selectClass}>
              {adultOptions.map((a) => (
                <option key={a} value={a} className="bg-[#0A1628]">{a}</option>
              ))}
            </select>
          </div>

          {/* Children */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Children</label>
            <select value={children} onChange={(e) => setChildren(e.target.value)} className={selectClass}>
              {childOptions.map((c) => (
                <option key={c} value={c} className="bg-[#0A1628]">{c}</option>
              ))}
            </select>
          </div>

          {/* Room Type */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Room Type</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className={selectClass}>
              {roomOptions.map((r) => (
                <option key={r} value={r} className="bg-[#0A1628]">{r}</option>
              ))}
            </select>
          </div>

          {/* View Preference */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>View Preference</label>
            <select value={viewPref} onChange={(e) => setViewPref(e.target.value)} className={selectClass}>
              {viewOptions.map((v) => (
                <option key={v} value={v} className="bg-[#0A1628]">{v}</option>
              ))}
            </select>
          </div>

          {/* CTA — spans 2 cols on sm and lg */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
            <span className="text-transparent text-[9px] select-none" aria-hidden="true">Search</span>
            <a
              href="#enquire"
              className="flex items-center justify-center gap-2 bg-gold text-navy px-5 py-3.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)] w-full"
            >
              <Search size={13} strokeWidth={2} />
              Check Availability
            </a>
          </div>

        </div>

        <p className="text-white/30 text-[10px] text-center mt-4 font-[family-name:var(--font-inter)]">
          Rates vary by season — peak periods include December and July.
        </p>
      </div>
    </section>
  )
}
