import { Link } from 'react-router-dom'
import { useState } from 'react'
import ToastNotice from '../shared/ToastNotice.jsx'
import PlayForm from './PlayForm.jsx'

function AccountAccessToast({ accountAccess }) {
  const [dismissedError, setDismissedError] = useState('')
  const accessError = accountAccess?.error || ''
  const shouldShow = Boolean(
    accountAccess?.isSignedIn && accessError && dismissedError !== accessError
  )

  return shouldShow ? (
    <ToastNotice
      tone="error"
      title="Failed to load account access"
      message={"We are showing demo mode because your purchased pack could not be loaded."}
      onDismiss={() => setDismissedError(accessError)}
    />
  ) : null
}

function PlayPage({ onHost, onJoin, busy, error, accountAccess, demoMode }) {
  const hasFullAccess = accountAccess?.access?.hasFullAccess

  return (
    <section className="play-page shell">
      <AccountAccessToast accountAccess={accountAccess} />
      <div className="play-copy">
        <div className="page-kicker">{demoMode ? 'Free demo' : 'Play a game'}</div>
        <h1>
          {demoMode
            ? 'Try the Demo games with your group.'
            : 'Host a room or join one already created.'}
        </h1>
        <p>
          {demoMode
            ? 'Play Majority Rules and Million Ladder in Demo mode. Guests can join room by code.'
            : 'The host chooses the game and controls the room. Players just enter their name and room code, then their phone becomes the controller.'}
        </p>
        {accountAccess?.isSignedIn && !hasFullAccess && (
          <div className="purchase-callout">
            <strong>Unlock All Games</strong>
            <span>
              Purchase a plan to host every game and use the full built-in question sets.
            </span>
            <Link className="primary" to="/pricing">
              View plans
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

export default PlayPage
