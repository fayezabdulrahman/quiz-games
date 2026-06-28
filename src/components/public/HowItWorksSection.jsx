const steps = [
  {
    number: '01',
    title: 'Pick the vibe',
    copy: 'Choose logic, bluffing, team surveys, buzzer puzzles, or a fast board race.',
  },
  {
    number: '02',
    title: 'Share the code',
    copy: 'The host creates the room. Everyone else joins from their own device.',
  },
  {
    number: '03',
    title: 'Run the show',
    copy: 'Scores, timers, team setup, and host controls stay in one live room.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="public-section shell">
      <div className="section-heading">
        <span className="eyebrow">How it works</span>
        <h2>Built for quiz nights that feel alive.</h2>
      </div>
      <div className="steps-grid">
        {steps.map((step) => (
          <article key={step.number}>
            <span>{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
