import PlayForm from './PlayForm.jsx'

export default function PlayPage({ onHost, onJoin, busy, error }) {
  return (
    <section className="play-page shell">
      <div className="play-copy">
        <div className="page-kicker">Play a game</div>
        <h1>Host a room or join the one already created.</h1>
        <p>
          The host chooses the game and controls the room. Players just enter their name and room
          code, then their phone becomes the controller.
        </p>
        <div className="play-benefits">
          <span>Family game nights</span>
          <span>Friend groups</span>
          <span>Office socials</span>
        </div>
      </div>
      <PlayForm onHost={onHost} onJoin={onJoin} busy={busy} error={error} />
    </section>
  )
}
