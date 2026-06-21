import Logo from './Logo.jsx'

export default function SurveyShowdownFinished({ state, onRestart, onChangeGame }) {
  const ordered = [...state.surveyTeams].sort((a, b) => b.score - a.score)
  return (
    <main className="finish-screen survey-finish">
      <Logo gameType="survey-showdown" />
      <div className="eyebrow">The survey says</div>
      <h1>{state.winnerNames.length > 1 ? 'A family tie!' : `${state.winnerNames[0]} wins!`}</h1>
      <div className="survey-final-teams">
        {ordered.map((team, index) => (
          <div className={index === 0 ? 'winner' : ''} key={team.id}>
            <span>{team.name}</span><strong>{team.score}</strong><small>points</small>
          </div>
        ))}
      </div>
      {state.isHost ? (
        <div className="finish-actions">
          <button type="button" className="primary" onClick={onRestart}>Replay Survey Showdown</button>
          <button type="button" className="secondary" onClick={onChangeGame}>Choose another game</button>
        </div>
      ) : <div className="waiting-banner">Waiting for the host</div>}
    </main>
  )
}
