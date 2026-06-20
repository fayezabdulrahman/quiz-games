export default function PlayerList({ players, compact = false, revealResponses = false }) {
  if (!players.length) {
    return <div className="empty-list">Waiting for the first brave contestant…</div>
  }

  return (
    <div className={`player-list ${compact ? 'compact' : ''}`}>
      {players.map((player) => (
        <div className={`player-pill ${!player.active ? 'eliminated' : ''}`} key={player.id}>
          <span className="player-dot" />
          <span className="player-name">{player.name}</span>
          {!player.connected && <small>offline</small>}
          {!player.active && <span className="out-badge">OUT</span>}
          {revealResponses && player.isCorrect === false && (
            <span className="wrong-answer">
              {player.submittedAnswer ? `Picked: ${player.submittedAnswer}` : 'No answer'}
            </span>
          )}
          {player.passedCurrentQuestion && player.active ? (
            <span className="pass-mini">PASS</span>
          ) : (
            player.hasAnswered && player.active && <span className="locked-mini">✓</span>
          )}
        </div>
      ))}
    </div>
  )
}
