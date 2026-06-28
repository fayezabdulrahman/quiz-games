import HeroSection from './HeroSection.jsx'
import HowItWorksSection from './HowItWorksSection.jsx'

export default function HomePage({ setPage }) {
  return (
    <>
      <HeroSection setPage={setPage} />
      <HowItWorksSection />
    </>
  )
}
