import Logo from './Logo.jsx'
import PlayerList from './PlayerList.jsx'

export default function Lobby({ state, onStart }) {
  const joinUrl = `${window.location.origin}?join=${state.code}`

  return (
    <main className="game-shell lobby">
      <header>
        <Logo />
        <span className="live-chip">LIVE ROOM</span>
      </header>
      <section className="lobby-grid">
        <div className="room-code-panel">
          <div className="eyebrow">Join at this address</div>
          <div className="join-url">{window.location.host}</div>
          <div className="room-code">{state.code}</div>
          <div className="code-caption">Room code</div>
          <button
            type="button"
            className="text-button"
            onClick={() => navigator.clipboard?.writeText(joinUrl)}
          >
            Copy invite link
          </button>
        </div>
        <div className="contestants-panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Contestants</div>
              <h2>{state.players.length} joined</h2>
            </div>
            <span className="pulse" />
          </div>
          <div className="room-settings-summary">
            <span>
              <strong>{state.settings.lifelineCount}</strong>{' '}
              {state.settings.lifelineCount === 1 ? 'pass' : 'passes'} each
            </span>
            <span>
              {state.settings.lifelinesAnytime ? 'Available all round' : 'Available from 50%'}
            </span>
          </div>
          <PlayerList players={state.players} />
          {state.isHost ? (
            <button
              type="button"
              className="primary wide"
              onClick={onStart}
              disabled={!state.players.length}
            >
              Start the game
            </button>
          ) : (
            <div className="waiting-banner">
              <span className="spinner" />
              Waiting for the host to begin
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
