import { useEffect, useState } from 'react'
import HostEndGameButton from '../../HostEndGameButton.jsx'
import Logo from '../../Logo.jsx'

function Timer({ remainingMs, durationMs }) {
  const [endsAt] = useState(() => Date.now() + remainingMs)
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil(remainingMs / 1000)))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    }, 200)
    return () => window.clearInterval(interval)
  }, [endsAt])

  const progress = Math.max(0, Math.min(1, seconds / (durationMs / 1000)))

  return (
    <div
      className={`question-timer catchphrase-timer ${seconds <= 10 ? 'urgent' : ''}`}
      style={{ '--timer-progress': `${progress * 360}deg` }}
      role="status"
      aria-label={`${seconds} seconds remaining`}
    >
      <div><strong>{seconds}</strong><span>seconds</span></div>
    </div>
  )
}

function PuzzleCanvas({ question }) {
  const tokens = question?.tokens || []
  const tokenItems = tokens.map((token, index) => ({
    key: `${question?.id || 'puzzle'}-${index + 1}-${token}`,
    position: index + 1,
    token,
  }))

  return (
    <div
      className={`catchphrase-puzzle ${question?.layout || ''}`}
      role="img"
      aria-label="Visual phrase clue"
    >
      {tokenItems.map((item) => (
        <span key={item.key} className={`puzzle-token token-${item.position}`}>
          {item.token}
        </span>
      ))}
      <span className="puzzle-line line-one" aria-hidden="true" />
      <span className="puzzle-line line-two" aria-hidden="true" />
      <span className="puzzle-shape shape-one" aria-hidden="true" />
      <span className="puzzle-shape shape-two" aria-hidden="true" />
    </div>
  )
}

function GuessForm({ onGuess }) {
  const [answer, setAnswer] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!answer.trim()) return
    onGuess(answer)
    setAnswer('')
  }

  return (
    <form className="catchphrase-answer-form" onSubmit={submit}>
      <label htmlFor="catchphrase-answer">Your answer</label>
      <input
        id="catchphrase-answer"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Type the phrase"
        autoComplete="off"
      />
      <button type="submit" className="primary">
        Lock answer
      </button>
    </form>
  )
}

function GuessBoard({ guesses = [] }) {
  if (!guesses.length) {
    return (
      <div className="catchphrase-guess-board is-empty" aria-live="polite">
        <div>
          <span className="eyebrow">Guesses</span>
          <strong>No guesses yet</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="catchphrase-guess-board" aria-live="polite">
      <div className="catchphrase-guess-board-header">
        <span className="eyebrow">Guesses</span>
        <strong>{guesses.length}</strong>
      </div>
      <div className="catchphrase-guess-list">
        {guesses.map((guess) => (
          <div
            className={`catchphrase-guess-item ${guess.isCorrect ? 'is-correct' : 'is-wrong'}`}
            key={`${guess.playerId}-${guess.answer}-${guess.isCorrect}-${guess.timedOut}`}
          >
            <span>{guess.playerName}</span>
            <strong>{guess.answer}</strong>
            <b>{guess.isCorrect ? 'Correct' : guess.timedOut ? 'Timer ran out' : 'Not quite'}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function Leaderboard({ players, highlightId }) {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return (
    <div className="catchphrase-leaderboard">
      {ordered.map((player, index) => {
        const className = [
          player.id === highlightId ? 'is-me' : '',
          player.roundPoints > 0 ? 'is-correct-round' : '',
        ].filter(Boolean).join(' ')

        return (
          <div className={className} key={player.id}>
            <span>{index + 1}</span>
            <strong>{player.name}</strong>
            {player.roundPoints > 0 && <small>+1</small>}
            <b>{player.score}</b>
          </div>
        )
      })}
    </div>
  )
}

function RevealPanel({ state }) {
  return (
    <div className="catchphrase-reveal">
      <div className="eyebrow">Catchphrase</div>
      <strong>{state.question.answer}</strong>
      <p>{state.question.explanation}</p>
      {state.catchphraseLastGuess && (
        <span className={state.catchphraseLastGuess.isCorrect ? 'right' : 'wrong'}>
          {state.catchphraseLastGuess.playerName}: {state.catchphraseLastGuess.answer}
        </span>
      )}
    </div>
  )
}

export default function SayWhatYouSeeScreen({
  state,
  error,
  onBuzz,
  onGuess,
  onReveal,
  onNext,
  onEnd,
}) {
  const isLastRound = state.questionIndex === state.totalQuestions - 1
  const buzzedMe = state.catchphraseBuzzerPlayerId === state.me?.id
  const canBuzz = !state.isHost && state.phase === 'answering' && !state.me?.buzzedOut
  const buzzedOutCount = state.players.filter((player) => player.buzzedOut).length

  return (
    <main className="game-shell catchphrase-shell">
      <header>
        <Logo gameType="say-what-you-see" />
        <div className="game-header-actions">
          <HostEndGameButton isHost={state.isHost} onEnd={onEnd} />
          <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
        </div>
      </header>
      <div className="progress-wrap">
        <div className="progress-copy">
          <span>Round {state.questionIndex + 1} of {state.totalQuestions}</span>
          <strong>Say what you see</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${((state.questionIndex + 1) / state.totalQuestions) * 100}%` }} />
        </div>
      </div>
      <section className="catchphrase-layout">
        <div className="catchphrase-main">
          <div className="catchphrase-heading">
            <div>
              <span className="catchphrase-round-number">Puzzle #{state.questionIndex + 1}</span>
              <h1>Say what you see</h1>
            </div>
            {state.phase === 'answering' && (
              <Timer
                key={state.questionEndsAt}
                remainingMs={state.questionTimeRemainingMs}
                durationMs={state.questionDurationMs}
              />
            )}
          </div>

          <PuzzleCanvas question={state.question} />

          {error && <p className="game-error" role="alert">{error}</p>}

          {state.phase === 'answering' && (
            state.isHost ? (
              <div className="host-controls catchphrase-host-controls">
                <strong>{buzzedOutCount} of {state.players.length} players have missed this puzzle</strong>
                <button type="button" className="primary wide" onClick={onReveal}>
                  Reveal answer
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="catchphrase-buzzer"
                onClick={onBuzz}
                disabled={!canBuzz}
              >
                {state.me?.buzzedOut ? 'Frozen Out' : 'Buzz in'}
              </button>
            )
          )}

          {state.phase === 'catchphrase-guessing' && (
            <div className="catchphrase-buzz-card">
              <div className="catchphrase-buzz-card-header">
                <div>
                  <div className="eyebrow">Buzzed in</div>
                  <strong>{state.catchphraseBuzzerName}</strong>
                </div>
                {state.catchphraseGuessTimerEnabled && state.catchphraseGuessTimeRemainingMs > 0 && (
                  <Timer
                    key={state.catchphraseGuessEndsAt}
                    remainingMs={state.catchphraseGuessTimeRemainingMs}
                    durationMs={state.catchphraseGuessDurationMs}
                  />
                )}
              </div>
              {state.isHost ? (
                <button type="button" className="secondary" onClick={onReveal}>
                  Reveal answer
                </button>
              ) : buzzedMe ? (
                <>
                  {state.catchphraseGuessTimerEnabled && (
                    <p className="catchphrase-guess-deadline">
                      Answer before the timer runs out or your guess is void.
                    </p>
                  )}
                  <GuessForm onGuess={onGuess} />
                </>
              ) : (
                <p>Waiting for their answer.</p>
              )}
            </div>
          )}

          <GuessBoard guesses={state.catchphraseGuesses} />

          {state.phase === 'revealed' && (
            <>
              <RevealPanel state={state} />
              {state.isHost && (
                <div className="host-round-actions">
                  <button type="button" className="primary" onClick={onNext}>
                    {isLastRound ? 'See final scores' : 'Next puzzle'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <aside className="catchphrase-scoreboard">
          <div className="eyebrow">Scoreboard</div>
          <h2>Fastest eyes</h2>
          <Leaderboard players={state.players} highlightId={state.me?.id} />
        </aside>
      </section>
    </main>
  )
}
