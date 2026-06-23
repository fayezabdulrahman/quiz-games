function TeamColumn({ team, players, isHost, onAssign }) {
  const members = players.filter((player) => player.teamId === team.id)
  const otherTeamId = team.id === 'lime' ? 'violet' : 'lime'

  return (
    <div className={`survey-lobby-team ${team.id}`}>
      <div>
        <strong>{team.name}</strong>
        <span>{members.length} players</span>
      </div>
      {members.length ? (
        <ul>
          {members.map((player) => (
            <li key={player.id}>
              <span>{player.name}</span>
              {isHost && (
                <button type="button" onClick={() => onAssign(player.id, otherTeamId)}>
                  Move
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No one assigned yet</p>
      )}
    </div>
  )
}

export default function SurveyTeamSetup({ state, onAssign, onRandomize }) {
  const unassigned = state.players.filter((player) => !player.teamId)

  return (
    <div className="survey-team-setup">
      <div className="survey-team-heading">
        <div>
          <strong>Build the teams</strong>
          <span>Balance the room manually, or let the app split everyone.</span>
        </div>
        {state.isHost && (
          <button type="button" className="secondary" onClick={onRandomize}>
            Randomly assign teams
          </button>
        )}
      </div>
      {unassigned.length > 0 && (
        <div className="survey-unassigned">
          <strong>Unassigned</strong>
          {unassigned.map((player) => (
            <div key={player.id}>
              <span>{player.name}</span>
              {state.isHost && (
                <span>
                  <button type="button" onClick={() => onAssign(player.id, 'lime')}>Lime</button>
                  <button type="button" onClick={() => onAssign(player.id, 'violet')}>Violet</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="survey-lobby-teams">
        {state.surveyTeams.map((team) => (
          <TeamColumn
            key={team.id}
            team={team}
            players={state.players}
            isHost={state.isHost}
            onAssign={onAssign}
          />
        ))}
      </div>
      <p className="survey-player-note">
        Each round starts with one player from each team facing off for control.
      </p>
    </div>
  )
}
