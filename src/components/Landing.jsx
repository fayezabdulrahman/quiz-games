import { useState } from 'react'
import Logo from './Logo.jsx'

export default function Landing({ onHost, onJoin, busy, error }) {
  const [mode, setMode] = useState('join')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [lifelineCount, setLifelineCount] = useState(1)
  const [lifelinesAnytime, setLifelinesAnytime] = useState(false)

  const submit = (event) => {
    event.preventDefault()

    if (mode === 'host') {
      onHost(name, { lifelineCount, lifelinesAnytime })
      return
    }

    onJoin(code, name)
  }

  return (
    <main className="landing shell">
      <section className="hero-copy">
        <div className="eyebrow">Logic beats knowledge</div>
        <Logo />
        <h1>How far can your group go?</h1>
        <p>
          Ten questions. One locked answer each. Stay sharp as the odds tumble all the way to 1%.
        </p>
        <div className="difficulty-track" aria-hidden="true">
          {[90, 70, 50, 30, 10, 1].map((value) => (
            <span key={value}>{value}%</span>
          ))}
        </div>
      </section>

      <section className="entry-card">
        <div className="tabs">
          <button
            type="button"
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join game
          </button>
          <button
            type="button"
            className={mode === 'host' ? 'active' : ''}
            onClick={() => setMode('host')}
          >
            Host game
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Your name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={mode === 'host' ? 'Quizmaster' : 'Alex'}
              maxLength={20}
              autoComplete="nickname"
            />
          </label>
          {mode === 'join' && (
            <label>
              Room code
              <input
                className="code-input"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, '')
                      .slice(0, 4),
                  )
                }
                placeholder="ABCD"
                maxLength={4}
                autoCapitalize="characters"
              />
            </label>
          )}
          {mode === 'host' && (
            <div className="host-settings">
              <div className="settings-heading">
                <div>
                  <strong>Pass lifelines</strong>
                  <span>Applied to every contestant for this round.</span>
                </div>
                <fieldset className="stepper" aria-label="Lifelines per player">
                  <button
                    type="button"
                    onClick={() => setLifelineCount((count) => Math.max(0, count - 1))}
                    disabled={lifelineCount === 0}
                    aria-label="Remove one lifeline"
                  >
                    −
                  </button>
                  <strong>{lifelineCount}</strong>
                  <button
                    type="button"
                    onClick={() => setLifelineCount((count) => Math.min(10, count + 1))}
                    disabled={lifelineCount === 10}
                    aria-label="Add one lifeline"
                  >
                    +
                  </button>
                </fieldset>
              </div>
              <label className="toggle-row">
                <span>
                  <strong>Allow passes at any time</strong>
                  <small>
                    {lifelinesAnytime
                      ? 'Available from the first question.'
                      : 'Unlocks from the 50% question, like the show.'}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={lifelinesAnytime}
                  onChange={(event) => setLifelinesAnytime(event.target.checked)}
                />
                <span className="toggle" aria-hidden="true" />
              </label>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="primary wide" disabled={busy}>
            {busy ? 'Connecting…' : mode === 'host' ? 'Create a room' : 'Join the club'}
          </button>
        </form>
        <p className="fine-print">
          No account needed. Best played with one host screen and a phone per player.
        </p>
      </section>
    </main>
  )
}
