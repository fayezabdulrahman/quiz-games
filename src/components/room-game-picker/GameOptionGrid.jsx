import Logo from '../shared/Logo.jsx'

const GAME_OPTIONS = [
  {
    id: 'quickfire-30',
    className: 'quickfire',
    description: 'Two teams describe five names against the clock',
  },
  {
    id: 'say-what-you-see',
    className: 'catchphrase',
    description: 'Visual puzzles, buzzers and fast guesses',
  },
  {
    id: 'one-percent',
    description: 'Logic, lifelines and elimination',
  },
  {
    id: 'bluff-battle',
    className: 'bluff',
    description: 'Invent fake answers and fool the room',
  },
  {
    id: 'majority-rules',
    className: 'majority',
    description: 'Read the room and score points',
  },
  {
    id: 'million-ladder',
    className: 'ladder',
    description: 'One contestant takes on the prize ladder',
  },
  {
    id: 'survey-showdown',
    className: 'survey',
    description: 'Two teams uncover answers, strike out and steal',
  },
]

export default function GameOptionGrid({ allowedGameTypes, selectedGameType, onSelectGameType }) {
  const canShowGame = (id) => allowedGameTypes.size === 0 || allowedGameTypes.has(id)

  return (
    <div className="room-game-grid">
      {GAME_OPTIONS.filter(({ id }) => canShowGame(id)).map((game) => (
        <button
          key={game.id}
          type="button"
          className={[
            'room-game-card',
            game.className,
            selectedGameType === game.id ? 'selected' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onSelectGameType(game.id)}
        >
          <Logo gameType={game.id === 'one-percent' ? undefined : game.id} />
          <span>{game.description}</span>
        </button>
      ))}
    </div>
  )
}
