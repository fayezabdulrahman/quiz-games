import { Link } from 'react-router-dom'
import PlayForm from './PlayForm.jsx'

export default function PlayPage({ onHost, onJoin, busy, error, accountAccess, demoMode }) {
  const hasFullAccess = accountAccess?.access?.hasFullAccess

  return (
    <section className="play-page shell">
      <div className="play-copy">
        <div className="page-kicker">{demoMode ? 'Free demo' : 'Play a game'}</div>
        <h1>{demoMode ? 'Try the Demo games with your group.' : 'Host a room or join one already created.'}</h1>
        <p>
          {demoMode
            ? 'Play Majority Rules and Million Ladder in Demo mode. Guests can join room by code.'
            : 'The host chooses the game and controls the room. Players just enter their name and room code, then their phone becomes the controller.'}
        </p>
        {accountAccess?.isSignedIn && !hasFullAccess && (
          <div className="purchase-callout">
            <strong>Unlock the full library</strong>
            <span>Purchase a pack to host every game and use the full built-in question pools.</span>
            <Link className="primary" to="/pricing">
              Purchase pack
            </Link>
          </div>
        )}
        <div className="play-benefits">
          <span>Family game nights</span>
          <span>Friend groups</span>
          <span>Office socials</span>
        </div>
      </div>
      <PlayForm
        onHost={onHost}
        onJoin={onJoin}
        busy={busy}
        error={error}
        accountAccess={accountAccess}
        demoMode={demoMode}
      />
    </section>
  )
}
