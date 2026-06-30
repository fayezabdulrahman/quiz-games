export default function HostEndGameButton({ isHost, onEnd, label = 'End game' }) {
  if (!isHost) return null

  return (
    <button type="button" className="host-end-game-button" onClick={onEnd}>
      {label}
    </button>
  )
}
