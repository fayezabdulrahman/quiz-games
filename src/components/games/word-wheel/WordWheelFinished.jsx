import Logo from '../../shared/Logo.jsx'

export default function WordWheelFinished({ state, onRestart, onChangeGame }) {
  const ordered = [...state.players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  )
  const winningScore = ordered[0]?.score || 0

  return (
    <main className="finish-screen word-wheel-finish">
      <Logo gameType="word-wheel" />
      <div className="eyebrow">Letters locked</div>
      <h1>{state.winnerNames.length > 1 ? 'Shared the wheel' : 'Word Wheel winner'}</h1>
      <div className="majority-winner-score">
        <strong>{winningScore}</strong>
        <span>{winningScore === 1 ? 'category win' : 'category wins'}</span>
      </div>
      <div className="winner-names">
        {state.winnerNames.map((name) => <span key={name}>{name}</span>)}
      </div>
      <div className="final-scoreboard">
        {ordered.map((player, index) => (
          <div key={player.id}>
            <span>{index + 1}</span>
            <strong>{player.name}</strong>
            <b>{player.score}</b>
          </div>
        ))}
      </div>
      {state.isHost ? (
        <div className="finish-actions">
          <button type="button" className="primary" onClick={onRestart}>
            Replay Word Wheel
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
