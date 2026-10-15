import Logo from '../../shared/Logo.jsx'

export default function QuizcraftFinished({ state, onRestart, onChangeGame }) {
  const ordered = [...state.players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  )
  const winningScore = ordered[0]?.score || 0
  const title = state.isHost
    ? state.winnerNames.length > 1 ? 'A shared victory' : 'Quizcraft champion'
    : 'Quiz complete'

  return (
    <main className="finish-screen quizcraft-finish">
      <Logo gameType="quizcraft" />
      <div className="eyebrow">Quiz complete</div>
      <h1>{title}</h1>
      {state.isHost ? (
        <>
          <div className="quizcraft-winner-score">
            <strong>{winningScore.toLocaleString()}</strong>
            <span>{winningScore === 1 ? 'point' : 'points'}</span>
          </div>
          <div className="winner-names">
            {state.winnerNames.map((name) => <span key={name}>{name}</span>)}
          </div>
          <div className="final-scoreboard">
            {ordered.map((player, index) => (
              <div key={player.id}>
                <span>{index + 1}</span>
                <strong>{player.name}</strong>
                <b>{player.score.toLocaleString()}</b>
              </div>
            ))}
          </div>
          <div className="finish-actions">
            <button type="button" className="primary" onClick={onRestart}>Replay this quiz</button>
            <button type="button" className="secondary" onClick={onChangeGame}>Choose another game</button>
          </div>
        </>
      ) : (
        <div className="waiting-banner">Final standings are on the host screen.</div>
      )}
    </main>
  )
}
