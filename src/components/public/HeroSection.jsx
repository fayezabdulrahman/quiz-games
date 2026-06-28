import heroImage from '../../assets/game-night-hero.png'

export default function HeroSection({ setPage }) {
  return (
    <section className="public-hero">
      <div className="hero-media" aria-hidden="true">
        <img src={heroImage} alt="" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content shell">
        <h1>Game Night</h1>
        <p>The easiest way to host unforgettable game nights.</p>
        <div className="hero-steps" aria-label="How Game Night works">
          <span>
            <b>Pick</b>
            Pick a game
          </span>
          <span>
            <b>Join</b>
            Everyone joins
          </span>
          <span>
            <b>Play</b>
            Play together
          </span>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={() => setPage('play')}>
            Host a room
          </button>
          <button type="button" className="secondary" onClick={() => setPage('games')}>
            Browse games
          </button>
        </div>
      </div>
    </section>
  )
}
