import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import AnnouncementRibbon from '@/components/AnnouncementRibbon'
import About from '@/components/About'
import Daycation from '@/components/Daycation'
import Rooms from '@/components/Rooms'
import StayExperience from '@/components/StayExperience'
import RoadToOpening from '@/components/RoadToOpening'
import ResortExperiences from '@/components/ResortExperiences'
import RooftopPool from '@/components/RooftopPool'
import ConceptVideo from '@/components/ConceptVideo'
import ArrivalExperience from '@/components/ArrivalExperience'
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
      <StayExperience />
      {/* The pool film leads, and Curated Resort Experiences reads as what the
          terrace opens onto, rather than delaying it. */}
      <RooftopPool />
      <ResortExperiences />
      <ConceptVideo />
      <ArrivalExperience />
      <Amenities />
      <Gallery />
      <Testimonials />
      <RoadToOpening />
      <DigitalPlatform />
      <BookCTA />
      <Footer />
    </main>
  )
}
