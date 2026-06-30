import GameLogoMark from '../shared/GameLogoMark.jsx'

export default function GameCard({ game }) {
  return (
    <article className={`public-game-card ${game.accent}`}>
      <GameLogoMark gameType={game.id} className="public-game-mark" />
      <div>
        <small>{game.kicker}</small>
        <h3>{game.name}</h3>
        <p>{game.summary}</p>
      </div>
      <span className="public-game-meta">{game.meta}</span>
    </article>
  )
}
