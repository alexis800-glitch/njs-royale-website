import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import AnnouncementRibbon from '@/components/AnnouncementRibbon'
import About from '@/components/About'
import Daycation from '@/components/Daycation'
import Rooms from '@/components/Rooms'
import ResortExperiences from '@/components/ResortExperiences'
import RooftopPool from '@/components/RooftopPool'
import ConceptVideo from '@/components/ConceptVideo'
import Amenities from '@/components/Amenities'
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
      <AnnouncementRibbon />
      <About />
      <Daycation />
      <Rooms />
      <ResortExperiences />
      <RooftopPool />
      <ConceptVideo />
      <Amenities />
      <Gallery />
      <Testimonials />
      <DigitalPlatform />
      <BookCTA />
      <Footer />
    </main>
  )
}
