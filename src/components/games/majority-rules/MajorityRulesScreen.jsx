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
      className={`question-timer majority-timer ${seconds <= 10 ? 'urgent' : ''}`}
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
    <div className="majority-leaderboard">
      {ordered.map((player, index) => (
        <div className={player.id === highlightId ? 'is-me' : ''} key={player.id}>
          <span className="leader-position">{index + 1}</span>
          <strong>{player.name}</strong>
          {player.roundPoints > 0 && <span className="round-point">+1</span>}
          <span className="score">{player.score}</span>
        </div>
      ))}
    </div>
  )
}

function Results({ state }) {
  const maxVotes = Math.max(1, ...state.question.results.map((result) => result.votes))
  const matched = state.me?.roundPoints > 0

  return (
    <div className="majority-results">
      <div className="eyebrow">
        {state.question.majorityAnswers.length > 1 ? 'The room is split' : 'The majority chose'}
      </div>
      <div className="majority-answer">
        {state.question.majorityAnswers.length
          ? state.question.majorityAnswers.join(' & ')
          : 'No votes submitted'}
      </div>
      <div className="vote-bars">
        {state.question.results.map((result) => (
          <div
            className={state.question.majorityAnswers.includes(result.option) ? 'winner' : ''}
            key={result.option}
          >
            <div className="vote-copy">
              <strong>{result.option}</strong>
              <span>{result.votes} {result.votes === 1 ? 'vote' : 'votes'}</span>
            </div>
            <div className="vote-track">
              <span style={{ width: `${(result.votes / maxVotes) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {!state.isHost && (
        <div className={`result-banner ${matched ? 'right' : 'wrong'}`}>
          {matched ? 'You read the room — one point!' : 'You missed the majority this time.'}
        </div>
      )}
    </div>
  )
}

export default function MajorityRulesScreen({
  state,
  error,
  onAnswer,
  onReveal,
  onNext,
  onEnd,
}) {
  const answered = state.players.filter((player) => player.hasAnswered).length
  const isLastRound = state.questionIndex === state.totalQuestions - 1

  return (
    <main className="game-shell majority-shell">
      <header>
        <Logo gameType="majority-rules" />
        <div className="game-header-actions">
          <HostEndGameButton isHost={state.isHost} onEnd={onEnd} />
          <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
        </div>
      </header>
      <div className="progress-wrap">
        <div className="progress-copy">
          <span>Round {state.questionIndex + 1} of {state.totalQuestions}</span>
          <strong>Match the room</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${((state.questionIndex + 1) / state.totalQuestions) * 100}%` }} />
        </div>
      </div>
      <section className="majority-layout">
        <div className="majority-main">
          <div className="majority-round-heading">
            <span className="majority-round-number">#{state.questionIndex + 1}</span>
            {state.phase === 'answering' && (
              <Timer
                key={state.questionEndsAt}
                remainingMs={state.questionTimeRemainingMs}
                durationMs={state.questionDurationMs}
              />
            )}
          </div>
          <div className="eyebrow">What will everyone else pick?</div>
          <h1>{state.question.prompt}</h1>
          {error && <p className="game-error" role="alert">{error}</p>}
          {state.phase === 'answering' ? (
            state.isHost ? (
              <div className="host-controls majority-host-controls">
                <div className="answer-meter">
                  <span style={{ width: `${state.players.length ? (answered / state.players.length) * 100 : 0}%` }} />
                </div>
                <strong>{answered} of {state.players.length} players have voted</strong>
                <button type="button" className="primary wide" onClick={onReveal}>
                  Reveal the majority
                </button>
              </div>
            ) : state.me?.hasAnswered ? (
              <div className="locked-card majority-locked">
                <div className="lock-icon">✓</div>
                <div><strong>Vote locked</strong><span>Now see whether you read the room.</span></div>
              </div>
            ) : (
              <div className="majority-options">
                {state.question.options.map((option) => (
                  <button type="button" key={option} onClick={() => onAnswer(option)}>
                    {option}
                  </button>
                ))}
              </div>
            )
          ) : (
            <Results state={state} />
          )}
          {state.phase === 'revealed' && state.isHost && (
            <div className="host-round-actions">
              <button type="button" className="primary" onClick={onNext}>
                {isLastRound ? 'See final scores' : 'Next round'}
              </button>
            </div>
          )}
        </div>
        <aside className="majority-scoreboard">
          <div className="eyebrow">Leaderboard</div>
          <h2>Room scores</h2>
          <Leaderboard players={state.players} highlightId={state.me?.id} />
        </aside>
      </section>
    </main>
  )
}
