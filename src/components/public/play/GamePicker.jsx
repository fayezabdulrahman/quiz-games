import { games } from '../../../data/games.js'
import GameLogoMark from '../../shared/GameLogoMark.jsx'

export default function GamePicker({
  gameType,
  setGameType,
  bluffRoundCount,
  majorityRoundCount,
  catchphraseRoundCount,
  availableGameTypes,
}) {
  const visibleGames = availableGameTypes
    ? games.filter((game) => availableGameTypes.includes(game.id))
    : games

  return (
    <div className="game-picker">
      <div className="game-picker-heading">
        <strong>Choose your game</strong>
        <span>Everyone joins after you create the room.</span>
      </div>
      {visibleGames.map((game) => (
        <button
          key={game.id}
          type="button"
          className={`game-card-option ${gameType === game.id ? `selected ${game.accent}` : ''}`}
          onClick={() => setGameType(game.id)}
        >
          <GameLogoMark gameType={game.id} className={`game-card-icon ${game.accent}-icon`} />
          <span>
            <strong>{game.name}</strong>
            <small>
              {game.id === 'say-what-you-see'
                ? `Visual puzzles · buzzer race · ${catchphraseRoundCount} rounds`
                : game.id === 'bluff-battle'
                  ? `Write fakes · fool friends · ${bluffRoundCount} rounds`
                  : game.id === 'majority-rules'
                    ? `Match the room · score points · ${majorityRoundCount} rounds`
                    : game.meta}
            </small>
          </span>
          <span className="selection-dot" />
        </button>
      ))}
    </div>
  )
}
