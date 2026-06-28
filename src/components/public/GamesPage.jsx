import { games } from '../../data/games.js'
import GameCard from './GameCard.jsx'

export default function GamesPage({ setPage }) {
  return (
    <section className="public-page shell">
      <div className="page-kicker">Games</div>
      <div className="page-title-row">
        <div>
          <h1>Choose the right game for the room.</h1>
          <p>
            Mix quick competitive rounds with bigger host-led formats. Start with one mode, then
            return to the same room to switch games.
          </p>
        </div>
        <button type="button" className="primary" onClick={() => setPage('play')}>
          Start playing
        </button>
      </div>
      <div className="games-page-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
