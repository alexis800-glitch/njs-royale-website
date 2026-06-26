import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import BookingBar from '@/components/BookingBar'
import Stats from '@/components/Stats'
import About from '@/components/About'
import Rooms from '@/components/Rooms'
import RooftopPool from '@/components/RooftopPool'
import Amenities from '@/components/Amenities'
import Gallery from '@/components/Gallery'
import Quote from '@/components/Quote'
import EventCenter from '@/components/EventCenter'
import Testimonials from '@/components/Testimonials'
import BookCTA from '@/components/BookCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <BookingBar />
      <Stats />
      <About />
      <Rooms />
      <RooftopPool />
      <Amenities />
      <Gallery />
      <Quote />
      <EventCenter />
      <Testimonials />
      <BookCTA />
      <Footer />
    </main>
  )
}
