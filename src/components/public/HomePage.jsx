import HeroSection from './HeroSection.jsx'
import HowItWorksSection from './HowItWorksSection.jsx'

export default function HomePage({ accountAccess }) {
  return (
    <>
      <HeroSection accountAccess={accountAccess} />
      <HowItWorksSection />
    </>
  )
}
