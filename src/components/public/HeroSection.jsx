import { Link } from 'react-router-dom'
import heroImage from '../../assets/game-night-hero.png'

export default function HeroSection({ accountAccess }) {
  const hostActionLabel = accountAccess?.access?.hasFullAccess ? 'Play' : 'Try now'

  return (
    <section className="public-hero">
      <div className="hero-media" aria-hidden="true">
        <img src={heroImage} alt="" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content shell">
        <div className="hero-copy">
          <h1>Game Night</h1>
          <p className="hero-line">Host a full party-game night from one browser.</p>
          <p>
            Pick from quick quizzes, bluffing games, survey rounds, visual puzzles, and team
            challenges.
          </p>
        </div>
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
            {hostActionLabel}
          </Link>
        </div>
        <div className="hero-room-demo" aria-hidden="true">
          <div className="host-screen">
            <div className="host-screen-top">
              <span>Live room</span>
              <strong>JOIN CODE: 4827</strong>
            </div>
            <div className="host-question">
              <small>Majority Rules</small>
              <b>Which snack disappears first?</b>
            </div>
            <div className="host-answer-board">
              <span style={{ '--bar-size': '78%' }}>Pizza</span>
              <span style={{ '--bar-size': '54%' }}>Crisps</span>
              <span style={{ '--bar-size': '39%' }}>Chocolate</span>
            </div>
            <div className="host-player-strip">
              <span>Alex ready</span>
              <span>Your answer: Pizza</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
