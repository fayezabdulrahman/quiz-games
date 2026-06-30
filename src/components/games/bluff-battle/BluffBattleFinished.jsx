import Logo from '../../shared/Logo.jsx'

export default function BluffBattleFinished({ state, onRestart, onChangeGame }) {
  const ordered = [...state.players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  )
  const winningScore = ordered[0]?.score || 0

  return (
    <main className="finish-screen bluff-finish">
      <Logo gameType="bluff-battle" />
      <div className="eyebrow">The lies have been counted</div>
      <h1>{state.winnerNames.length > 1 ? 'Masters of deception' : 'Bluff champion'}</h1>
      <div className="bluff-winner-score">
        <strong>{winningScore}</strong>
        <span>{winningScore === 1 ? 'point' : 'points'}</span>
      </div>
      <div className="winner-names">
        {state.winnerNames.map((name) => <span key={name}>{name}</span>)}
      </div>
      <div className="final-scoreboard bluff-final-scoreboard">
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
            Replay Bluff Battle
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
