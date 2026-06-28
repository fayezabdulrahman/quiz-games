function TeamColumn({ team, players, isHost, onAssign }) {
  const members = players.filter((player) => player.teamId === team.id)
  return (
    <div className={`quickfire-lobby-team ${team.id}`}>
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
                <button
                  type="button"
                  onClick={() => onAssign(player.id, team.id === 'coral' ? 'blue' : 'coral')}
                >
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

export default function QuickfireTeamSetup({ state, onAssign, onRandomize }) {
  const unassigned = state.players.filter((player) => !player.teamId)
  return (
    <div className="quickfire-team-setup">
      <div className="quickfire-team-heading">
        <div>
          <strong>Build the teams</strong>
          <span>Randomise them, or move family members manually.</span>
        </div>
        {state.isHost && (
          <button type="button" className="secondary" onClick={onRandomize}>
            Randomly assign teams
          </button>
        )}
      </div>
      {unassigned.length > 0 && (
        <div className="quickfire-unassigned">
          <strong>Unassigned</strong>
          {unassigned.map((player) => (
            <div key={player.id}>
              <span>{player.name}</span>
              {state.isHost && (
                <span>
                  <button type="button" onClick={() => onAssign(player.id, 'coral')}>Team A</button>
                  <button type="button" onClick={() => onAssign(player.id, 'blue')}>Team B</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="quickfire-lobby-teams">
        {state.quickfireTeams.map((team) => (
          <TeamColumn
            key={team.id}
            team={team}
            players={state.players}
            isHost={state.isHost}
            onAssign={onAssign}
          />
        ))}
      </div>
      <p className="quickfire-player-note">
        Two players works as a head-to-head house rule. Four or more gives each describer
        teammates to guess.
      </p>
    </div>
  )
}
