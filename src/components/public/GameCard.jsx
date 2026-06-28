export default function GameCard({ game }) {
  return (
    <article className={`public-game-card ${game.accent}`}>
      <span className="public-game-mark">{game.mark}</span>
      <div>
        <small>{game.kicker}</small>
        <h3>{game.name}</h3>
        <p>{game.summary}</p>
      </div>
      <span className="public-game-meta">{game.meta}</span>
    </article>
  )
}
