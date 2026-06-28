import { useState } from 'react'
import HostFields from './play/HostFields.jsx'
import JoinFields from './play/JoinFields.jsx'

export default function PlayForm({ onHost, onJoin, busy, error }) {
  const [mode, setMode] = useState('join')
  const [gameType, setGameType] = useState('one-percent')
  const [name, setName] = useState('')
  const [code, setCode] = useState(
    () => new URLSearchParams(window.location.search).get('join')?.slice(0, 4).toUpperCase() || '',
  )
  const [lifelineCount, setLifelineCount] = useState(1)
  const [lifelinesAnytime, setLifelinesAnytime] = useState(false)
  const [diceMode, setDiceMode] = useState('digital')
  const [bluffRoundCount, setBluffRoundCount] = useState(6)
  const [majorityRoundCount, setMajorityRoundCount] = useState(8)
  const [catchphraseRoundCount, setCatchphraseRoundCount] = useState(10)
  const [catchphraseTimerEnabled, setCatchphraseTimerEnabled] = useState(false)
  const [catchphraseGuessSeconds, setCatchphraseGuessSeconds] = useState(10)

  const submit = (event) => {
    event.preventDefault()

    if (mode === 'host') {
      onHost(gameType, {
        lifelineCount,
        lifelinesAnytime,
        diceMode,
        roundCount:
          gameType === 'say-what-you-see'
            ? catchphraseRoundCount
            : gameType === 'majority-rules'
              ? majorityRoundCount
              : gameType === 'bluff-battle'
                ? bluffRoundCount
                : undefined,
        guessTimerEnabled: catchphraseTimerEnabled,
        guessSeconds: catchphraseGuessSeconds,
      })
      return
    }

    onJoin(code, name)
  }

  return (
    <section className="entry-card play-card">
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
        {mode === 'join' && (
          <JoinFields name={name} code={code} setName={setName} setCode={setCode} />
        )}
        {mode === 'host' && (
          <HostFields
            gameType={gameType}
            setGameType={setGameType}
            lifelineCount={lifelineCount}
            setLifelineCount={setLifelineCount}
            lifelinesAnytime={lifelinesAnytime}
            setLifelinesAnytime={setLifelinesAnytime}
            diceMode={diceMode}
            setDiceMode={setDiceMode}
            bluffRoundCount={bluffRoundCount}
            setBluffRoundCount={setBluffRoundCount}
            majorityRoundCount={majorityRoundCount}
            setMajorityRoundCount={setMajorityRoundCount}
            catchphraseRoundCount={catchphraseRoundCount}
            setCatchphraseRoundCount={setCatchphraseRoundCount}
            catchphraseTimerEnabled={catchphraseTimerEnabled}
            setCatchphraseTimerEnabled={setCatchphraseTimerEnabled}
            catchphraseGuessSeconds={catchphraseGuessSeconds}
            setCatchphraseGuessSeconds={setCatchphraseGuessSeconds}
          />
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="primary wide" disabled={busy}>
          {busy ? 'Connecting…' : mode === 'host' ? 'Create game room' : 'Join room'}
        </button>
      </form>
      <p className="fine-print">Guests join free with a room code. Best with one phone per player.</p>
    </section>
  )
}
