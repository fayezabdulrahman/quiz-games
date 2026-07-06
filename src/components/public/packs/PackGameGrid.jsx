import { games } from '../../../data/games.js'
import GameLogoMark from '../../shared/GameLogoMark.jsx'

export default function PackGameGrid({ gameType, onSelectGame }) {
  return (
    <div className="pack-game-grid">
      {games.map((game) => (
        <button
          type="button"
          key={game.id}
          className={`pack-game-card public-game-card ${game.accent} ${gameType === game.id ? 'active' : ''}`}
          onClick={() => onSelectGame(game.id)}
        >
          <GameLogoMark gameType={game.id} className="public-game-mark" />
          <span>
            <small>{game.kicker}</small>
            <strong>{game.name}</strong>
          </span>
        </button>
      ))}
    </div>
  )
}
