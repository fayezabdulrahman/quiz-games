import Logo from './Logo.jsx'

export default function SayWhatYouSeeFinished({ state, onRestart, onChangeGame }) {
  const ordered = [...state.players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  )
  const winningScore = ordered[0]?.score || 0

  return (
    <main className="finish-screen catchphrase-finish">
      <Logo gameType="say-what-you-see" />
      <div className="eyebrow">Say what you see</div>
      <h1>{state.winnerNames.length > 1 ? 'Shared sharp eyes' : 'Fastest eyes wins'}</h1>
      <div className="catchphrase-winner-score">
        <strong>{winningScore}</strong>
        <span>{winningScore === 1 ? 'puzzle' : 'puzzles'} solved</span>
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
            Replay Say What You See
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
