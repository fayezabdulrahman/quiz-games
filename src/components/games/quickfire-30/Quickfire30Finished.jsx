import Logo from '../../shared/Logo.jsx'

export default function Quickfire30Finished({ state, onRestart, onChangeGame }) {
  const ordered = [...state.quickfireTeams].sort((a, b) => b.position - a.position)
  return (
    <main className="finish-screen quickfire-finish">
      <Logo gameType="quickfire-30" />
      <div className="eyebrow">{state.finishReason === 'host-ended' ? 'Final positions' : 'Finish line reached'}</div>
      <h1>{state.winnerNames.length > 1 ? 'Dead heat!' : `${state.winnerNames[0]} wins!`}</h1>
      <div className="quickfire-final-teams">
        {ordered.map((team, index) => (
          <div className={`${team.id} ${index === 0 ? 'winner' : ''}`} key={team.id}>
            <i />
            <span>{team.name}</span>
            <strong>{team.position}</strong>
            <small>spaces</small>
          </div>
        ))}
      </div>
      {state.isHost ? (
        <div className="finish-actions">
          <button type="button" className="primary" onClick={onRestart}>Play Quickfire 30 again</button>
          <button type="button" className="secondary" onClick={onChangeGame}>Choose another game</button>
        </div>
      ) : <div className="waiting-banner">Waiting for the host</div>}
    </main>
  )
}
