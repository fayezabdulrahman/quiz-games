import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'

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
      className={`question-timer bluff-timer ${seconds <= 10 ? 'urgent' : ''}`}
      style={{ '--timer-progress': `${progress * 360}deg` }}
      role="status"
      aria-label={`${seconds} seconds remaining`}
    >
      <div><strong>{seconds}</strong><span>seconds</span></div>
    </div>
  )
}

function Leaderboard({ players, highlightId }) {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return (
    <div className="bluff-leaderboard">
      {ordered.map((player, index) => (
        <div className={player.id === highlightId ? 'is-me' : ''} key={player.id}>
          <span>{index + 1}</span>
          <strong>{player.name}</strong>
          {player.roundPoints > 0 && <small>+{player.roundPoints}</small>}
          <b>{player.score}</b>
        </div>
      ))}
    </div>
  )
}

function BluffForm({ inputMode, onSubmit }) {
  const [bluff, setBluff] = useState('')
  const expectsNumber = inputMode === 'numeric'

  const submit = (event) => {
    event.preventDefault()
    onSubmit(bluff)
  }

  return (
    <form className="bluff-form" onSubmit={submit}>
      <label htmlFor="bluff-answer">Your believable fake answer</label>
      <textarea
        id="bluff-answer"
        value={bluff}
        onChange={(event) => setBluff(event.target.value)}
        maxLength={100}
        placeholder={expectsNumber ? 'Enter a convincing number…' : 'Make it convincing…'}
        autoComplete="off"
        inputMode={inputMode}
      />
      <div>
        <span>{bluff.length}/100</span>
        <button type="submit" className="primary" disabled={!bluff.trim()}>
          Lock in bluff
        </button>
      </div>
    </form>
  )
}

function BluffResults({ state }) {
  const selected = state.bluffOptions.find(
    (option) => option.id === state.selectedVoteOptionId,
  )

  return (
    <div className="bluff-results">
      <div className="eyebrow">The truth was</div>
      <div className="bluff-truth">{state.question.answer}</div>
      <p>{state.question.explanation}</p>
      <div className="bluff-reveal-list">
        {state.bluffOptions.map((option) => (
          <div className={option.isTruth ? 'truth' : ''} key={option.id}>
            <div>
              <strong>{option.text}</strong>
              <span>
                {option.isTruth ? 'THE TRUTH' : `Written by ${option.authorName}`}
              </span>
              {!option.isTruth && option.voterNames.length > 0 && (
                <span className="fooled-players">
                  Fooled {option.voterNames.join(', ')}
                </span>
              )}
            </div>
            <b>{option.votes} {option.votes === 1 ? 'vote' : 'votes'}</b>
          </div>
        ))}
      </div>
      {!state.isHost && (
        <div className={`result-banner ${selected?.isTruth ? 'right' : 'wrong'}`}>
          {state.me.roundPoints > 0
            ? `You scored ${state.me.roundPoints} ${state.me.roundPoints === 1 ? 'point' : 'points'} this round.`
            : 'No points this round — time to sharpen that poker face.'}
        </div>
      )}
    </div>
  )
}

export default function BluffBattleScreen({
  state,
  error,
  onSubmitBluff,
  onVote,
  onAdvancePhase,
  onNext,
  onEnd,
}) {
  const bluffsIn = state.players.filter((player) => player.bluffSubmitted).length
  const votesIn = state.players.filter((player) => player.hasVoted).length
  const isLastRound = state.questionIndex === state.totalQuestions - 1
  const phaseCount = state.phase === 'bluffing' ? bluffsIn : votesIn
  const phaseLabel = state.phase === 'bluffing' ? 'bluffs submitted' : 'votes locked'

  return (
    <main className="game-shell bluff-shell">
      <header>
        <Logo gameType="bluff-battle" />
        <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
      </header>
      <div className="progress-wrap">
        <div className="progress-copy">
          <span>Round {state.questionIndex + 1} of {state.totalQuestions}</span>
          <strong>
            {state.phase === 'bluffing'
              ? 'Write a lie'
              : state.phase === 'voting'
                ? 'Find the truth'
                : 'Bluffs exposed'}
          </strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${((state.questionIndex + 1) / state.totalQuestions) * 100}%` }} />
        </div>
      </div>
      <section className="bluff-layout">
        <div className="bluff-main">
          <div className="bluff-heading-row">
            <span className="bluff-round-number">LIE #{state.questionIndex + 1}</span>
            {(state.phase === 'bluffing' || state.phase === 'voting') && (
              <Timer
                key={state.questionEndsAt}
                remainingMs={state.questionTimeRemainingMs}
                durationMs={state.questionDurationMs}
              />
            )}
          </div>
          <div className="eyebrow">
            {state.phase === 'bluffing' ? 'Fill in the blank with fiction' : 'Which answer is real?'}
          </div>
          <h1>{state.question.prompt}</h1>
          {error && <p className="game-error" role="alert">{error}</p>}

          {state.phase === 'bluffing' && (
            state.isHost ? (
              <div className="host-controls bluff-host-controls">
                <div className="answer-meter">
                  <span style={{ width: `${(bluffsIn / state.players.length) * 100}%` }} />
                </div>
                <strong>{bluffsIn} of {state.players.length} bluffs submitted</strong>
                <button type="button" className="primary wide" onClick={onAdvancePhase}>
                  Open voting
                </button>
              </div>
            ) : state.me.bluffSubmitted ? (
              <div className="locked-card bluff-locked">
                <div className="lock-icon">✓</div>
                <div><strong>Bluff locked</strong><span>Keep a straight face while everyone else writes.</span></div>
              </div>
            ) : (
              <BluffForm inputMode={state.question.inputMode} onSubmit={onSubmitBluff} />
            )
          )}

          {state.phase === 'voting' && (
            state.isHost ? (
              <div className="host-controls bluff-host-controls">
                <div className="answer-meter">
                  <span style={{ width: `${(votesIn / state.players.length) * 100}%` }} />
                </div>
                <strong>{votesIn} of {state.players.length} votes locked</strong>
                <button type="button" className="primary wide" onClick={onAdvancePhase}>
                  Reveal the truth
                </button>
              </div>
            ) : state.me.hasVoted ? (
              <div className="locked-card bluff-locked">
                <div className="lock-icon">✓</div>
                <div><strong>Vote locked</strong><span>Truth or trickery? We’re about to find out.</span></div>
              </div>
            ) : (
              <div className="bluff-options">
                {state.bluffOptions.map((option) => {
                  const isOwn = option.id === state.ownBluffOptionId
                  return (
                    <button
                      type="button"
                      key={option.id}
                      disabled={isOwn}
                      onClick={() => onVote(option.id)}
                    >
                      <span>{option.text}</span>
                      {isOwn && <small>Your bluff</small>}
                    </button>
                  )
                })}
              </div>
            )
          )}

          {state.phase === 'revealed' && <BluffResults state={state} />}

          {state.phase === 'revealed' && state.isHost && (
            <div className="host-round-actions">
              <button type="button" className="primary" onClick={onNext}>
                {isLastRound ? 'See final scores' : 'Next round'}
              </button>
              {!isLastRound && (
                <button type="button" className="secondary danger" onClick={onEnd}>
                  End game
                </button>
              )}
            </div>
          )}
        </div>
        <aside className="bluff-scoreboard">
          <div className="eyebrow">Leaderboard</div>
          <h2>Best bluffers</h2>
          <Leaderboard players={state.players} highlightId={state.me?.id} />
          {state.phase !== 'revealed' && (
            <div className="bluff-phase-count">
              <strong>{phaseCount}/{state.players.length}</strong>
              <span>{phaseLabel}</span>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
