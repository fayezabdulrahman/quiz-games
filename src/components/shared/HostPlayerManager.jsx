import { useState } from 'react'

export default function HostPlayerManager({ state, onKick }) {
  const [open, setOpen] = useState(false)
  const [pendingPlayer, setPendingPlayer] = useState(null)

  if (!state.isHost || !state.players.length) return null

  const confirmKick = async () => {
    if (!pendingPlayer) return
    const result = await onKick(pendingPlayer.id)
    if (result?.ok) setPendingPlayer(null)
  }

  return (
    <aside className="host-player-manager">
      <button type="button" className="host-player-manager-toggle" onClick={() => setOpen(!open)}>
        Players ({state.players.length})
      </button>
      {open && (
        <div className="host-player-manager-panel">
          <div>
            <strong>Manage players</strong>
            <button type="button" className="host-player-manager-close" onClick={() => setOpen(false)} aria-label="Close player manager">×</button>
          </div>
          {state.players.map((player) => (
            <div className="host-player-manager-row" key={player.id}>
              <span><b>{player.name}</b><small>{player.connected ? 'Playing' : 'Disconnected'}</small></span>
              <button type="button" onClick={() => setPendingPlayer(player)}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {pendingPlayer && (
        <div className="host-player-manager-backdrop" role="presentation">
          <div className="host-player-manager-confirm" role="dialog" aria-modal="true" aria-labelledby="remove-player-title">
            <h2 id="remove-player-title">Remove {pendingPlayer.name}?</h2>
            <p>They will be kicked from the room and won’t be able to reconnect to this game.</p>
            <div>
              <button type="button" className="secondary" onClick={() => setPendingPlayer(null)}>Cancel</button>
              <button type="button" className="secondary danger" onClick={confirmKick}>Remove player</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
