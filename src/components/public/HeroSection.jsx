import { Link } from 'react-router-dom'
import heroImage from '../../assets/game-night-hero.png'

export default function HeroSection() {
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
          <Link className="primary" to="/games">
            Browse games
          </Link>
          <Link className="secondary hero-host-action" to="/demo">
            Try now
          </Link>
        </div>
      </div>
    </section>
  )
}
