import heroImage from '../../assets/game-night-hero.png'

export default function HeroSection({ setPage }) {
  return (
    <section className="public-hero">
      <div className="hero-media" aria-hidden="true">
        <img src={heroImage} alt="" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content shell">
        <div className="eyebrow">Your browser-based game show room</div>
        <h1>One link. One room. A whole night of games.</h1>
        <p>
          Host party games for family nights, friend groups, office socials, and quick team breaks.
          Players join with a room code and use their phones as controllers.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={() => setPage('play')}>
            Host or join
          </button>
          <button type="button" className="secondary" onClick={() => setPage('games')}>
            Browse games
          </button>
        </div>
      </div>
    </section>
  )
}
