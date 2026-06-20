import { useEffect, useRef, useState } from 'react'
import Logo from './Logo.jsx'
import PlayerList from './PlayerList.jsx'

export default function Lobby({ state, onStart }) {
  const joinUrl = `${window.location.origin}?join=${state.code}`
  const [copyStatus, setCopyStatus] = useState('')
  const copyTimer = useRef(null)

  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current)
    },
    [],
  )

  const copyInvite = async () => {
    window.clearTimeout(copyTimer.current)
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopyStatus('Invite link copied')
    } catch {
      setCopyStatus('Could not copy the link')
    }
    copyTimer.current = window.setTimeout(() => setCopyStatus(''), 2400)
  }

  return (
    <main className="game-shell lobby">
      <header>
        <Logo gameType={state.gameType} />
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
            onClick={copyInvite}
          >
            {copyStatus === 'Invite link copied' ? 'Copied!' : 'Copy invite link'}
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
            {state.gameType === 'bluff-battle' ? (
              <>
                <span><strong>5</strong> bluffing rounds</span>
                <span>2 points for truth · 1 per fooled player</span>
              </>
            ) : state.gameType === 'majority-rules' ? (
              <>
                <span><strong>8</strong> opinion rounds</span>
                <span>Match the majority to score</span>
              </>
            ) : (
              <>
                <span>
                  <strong>{state.settings.lifelineCount}</strong>{' '}
                  {state.settings.lifelineCount === 1 ? 'pass' : 'passes'} each
                </span>
                <span>
                  {state.settings.lifelinesAnytime ? 'Available all round' : 'Available from 50%'}
                </span>
              </>
            )}
          </div>
          <PlayerList players={state.players} />
          {state.isHost ? (
            <button
              type="button"
              className="primary wide"
              onClick={onStart}
              disabled={
                state.gameType === 'bluff-battle'
                  ? state.players.length < 2
                  : !state.players.length
              }
            >
              {state.gameType === 'bluff-battle' && state.players.length < 2
                ? 'Waiting for 2 players'
                : 'Start the game'}
            </button>
          ) : (
            <div className="waiting-banner">
              <span className="spinner" />
              Waiting for the host to begin
            </div>
          )}
        </div>
      </section>
      {copyStatus && (
        <div
          className={`toast ${copyStatus.startsWith('Could') ? 'toast-error' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span>{copyStatus.startsWith('Could') ? '!' : '✓'}</span>
          {copyStatus}
        </div>
      )}
    </main>
  )
}
