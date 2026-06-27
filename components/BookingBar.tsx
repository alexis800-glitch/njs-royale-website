'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const guestOptions = ['1 Guest', '2 Guests', '3 Guests', '4 Guests', '5+ Guests']
const roomOptions  = ['All Room Types', 'Deluxe Ocean View', 'Junior Suite', 'Ocean Suite', 'Penthouse Suite']

export default function BookingBar() {
  const [checkIn,  setCheckIn]  = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests,   setGuests]   = useState('2 Guests')
  const [roomType, setRoomType] = useState('All Room Types')

  return (
    <section className="bg-[#060E1A] border-b border-gold/10 py-7 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <p className="text-gold/70 text-[10px] uppercase tracking-[2px] text-center mb-5 font-[family-name:var(--font-inter)]">
          Reservations Opening Soon — Register Your Interest Below
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">

          {/* Check-in */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#0A1628] border border-gold/30 text-white/75 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors duration-300 font-[family-name:var(--font-inter)] w-full"
            />
          </div>

          {/* Check-out */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#0A1628] border border-gold/30 text-white/75 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors duration-300 font-[family-name:var(--font-inter)] w-full"
            />
          </div>

          {/* Guests */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="bg-[#0A1628] border border-gold/30 text-white/75 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors duration-300 font-[family-name:var(--font-inter)] w-full appearance-none cursor-pointer"
            >
              {guestOptions.map((g) => (
                <option key={g} value={g} className="bg-[#0A1628]">{g}</option>
              ))}
            </select>
          </div>

          {/* Room Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-[10px] uppercase tracking-[2px] font-[family-name:var(--font-inter)]">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="bg-[#0A1628] border border-gold/30 text-white/75 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors duration-300 font-[family-name:var(--font-inter)] w-full appearance-none cursor-pointer"
            >
              {roomOptions.map((r) => (
                <option key={r} value={r} className="bg-[#0A1628]">{r}</option>
              ))}
            </select>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-1.5">
            <span className="text-transparent text-[9px] select-none" aria-hidden="true">Search</span>
            <a
              href="#enquire"
              className="flex items-center justify-center gap-2 bg-gold text-navy px-5 py-3.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-white transition-colors duration-300 font-[family-name:var(--font-inter)] whitespace-nowrap"
            >
              <Search size={13} strokeWidth={2} />
              Check Availability
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
