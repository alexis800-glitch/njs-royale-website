import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Rooms from '@/components/Rooms'
import ResortExperiences from '@/components/ResortExperiences'
import RooftopPool from '@/components/RooftopPool'
import ConceptVideo from '@/components/ConceptVideo'
import Amenities from '@/components/Amenities'
import EventCenter from '@/components/EventCenter'
import Gallery from '@/components/Gallery'
import Testimonials from '@/components/Testimonials'
import DigitalPlatform from '@/components/DigitalPlatform'
import BookCTA from '@/components/BookCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Rooms />
      <ResortExperiences />
      <RooftopPool />
      <ConceptVideo />
      <Amenities />
      <EventCenter />
      <Gallery />
      <Testimonials />
      <DigitalPlatform />
      <BookCTA />
      <Footer />
    </main>
  )
}
