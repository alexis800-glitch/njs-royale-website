import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import PhaseOneBanner from '@/components/PhaseOneBanner'
import AnnouncementRibbon from '@/components/AnnouncementRibbon'
import About from '@/components/About'
import PhaseOne from '@/components/Daycation'
import Rooms from '@/components/Rooms'
import StayExperience from '@/components/StayExperience'
import RoadToOpening from '@/components/RoadToOpening'
import ResortExperiences from '@/components/ResortExperiences'
import ConceptVideo from '@/components/ConceptVideo'
import ArrivalExperience from '@/components/ArrivalExperience'
import Amenities from '@/components/Amenities'
import Gallery from '@/components/Gallery'
import Testimonials from '@/components/Testimonials'
import DigitalPlatform from '@/components/DigitalPlatform'
import LocationMap from '@/components/LocationMap'
import BookCTA from '@/components/BookCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      {/* On mobile the banner is in normal flow below the fixed header (pt clears it)
          and the hero follows; on desktop the banner overlays the top of the hero. */}
      <div className="relative pt-[84px] sm:pt-0">
        <PhaseOneBanner />
        <Hero />
      </div>
      <AnnouncementRibbon />
      <About />
      <PhaseOne />
      <Rooms />
      <StayExperience />
      <ResortExperiences />
      <ConceptVideo />
      <ArrivalExperience />
      <Amenities />
      <Gallery />
      <Testimonials />
      <RoadToOpening />
      <DigitalPlatform />
      <LocationMap />
      <BookCTA />
      <Footer />
    </main>
  )
}
