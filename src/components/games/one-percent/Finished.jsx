import Logo from '../../Logo.jsx'

function getWinnerMessage(winnerCount) {
  if (winnerCount === 1) {
    return 'One magnificent brain made it all the way.'
  }

  if (winnerCount > 1) {
    return `${winnerCount} brilliant brains survived.`
  }

  return 'That calls for an immediate rematch.'
}

export default function Finished({ state, onRestart, onChangeGame }) {
  const winners = state.winnerNames
  const playerCount = state.players.length
  const endedEarly = state.finishReason === 'host-ended'
  const everyoneLost = state.finishReason === 'all-eliminated'
  const eyebrow = endedEarly
    ? `Game ended after the ${state.difficulty}% question`
    : everyoneLost
      ? `Eliminated on the ${state.difficulty}% question`
      : 'The 1% question is complete'
  const heading = everyoneLost
    ? playerCount === 1
      ? 'The club claims another contestant'
      : 'The club claims the whole group'
    : winners.length
      ? endedEarly
        ? 'Final standings'
        : 'Welcome to the club'
      : 'The 1% beat everyone'

  return (
    <main className={`finish-screen ${everyoneLost ? 'everyone-lost' : ''}`}>
      {!everyoneLost && (
        <>
          <div className="confetti one" />
          <div className="confetti two" />
          <div className="confetti three" />
        </>
      )}
      <Logo />
      <div className="eyebrow">{eyebrow}</div>
      <h1>{heading}</h1>
      <div className="winner-orb">{state.difficulty}%</div>
      {everyoneLost ? (
        <section className="elimination-answer">
          <div className="eyebrow">
            {playerCount === 1 ? 'Your answer was incorrect' : 'Everyone answered incorrectly'}
          </div>
          <span>The correct answer was</span>
          <strong>{state.question.answer}</strong>
          <p>{state.question.explanation}</p>
        </section>
      ) : (
        <>
          <div className="winner-names">
            {winners.length ? (
              winners.map((name) => <span key={name}>{name}</span>)
            ) : (
              <span>No winners this time</span>
            )}
          </div>
          <p>{getWinnerMessage(winners.length)}</p>
        </>
      )}
      {state.isHost ? (
        <div className="finish-actions">
          <button type="button" className="primary" onClick={onRestart}>
            Replay The 1% Club
          </button>
          <button type="button" className="secondary" onClick={onChangeGame}>
            Choose another game
          </button>
        </div>
      ) : (
        <div className="waiting-banner">Waiting for the host</div>
      )}
    </main>
  )
}
