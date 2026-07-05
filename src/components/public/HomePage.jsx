import HeroSection from './HeroSection.jsx'
import HowItWorksSection from './HowItWorksSection.jsx'

const reassurancePoints = [
  'Guests join free.',
  'No app downloads.',
  'Works in person or over video call.',
]

function HostReassuranceSection() {
  return (
    <section className="public-section shell host-reassurance">
      <div className="section-heading">
        <span className="eyebrow">Host with confidence</span>
        <h2>Set up once, run the whole night.</h2>
      </div>
      <div className="reassurance-grid">
        {reassurancePoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>
    </section>
  )
}

export default function HomePage({ accountAccess }) {
  return (
    <>
      <HeroSection accountAccess={accountAccess} />
      <HowItWorksSection />
      <HostReassuranceSection />
    </>
  )
}
