import { useEffect, useState } from 'react'
import { MILLION_LADDER_PRIZES, formatPrize } from '../game/millionLadder.js'
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
      className={`question-timer ladder-timer ${seconds <= 10 ? 'urgent' : ''}`}
      style={{ '--timer-progress': `${progress * 360}deg` }}
      role="status"
      aria-label={`${seconds} seconds remaining`}
    >
      <div><strong>{seconds}</strong><span>seconds</span></div>
    </div>
  )
}

function PrizeLadder({ currentIndex, reachedIndex }) {
  return (
    <div className="prize-ladder">
      {[...MILLION_LADDER_PRIZES].reverse().map((prize, reverseIndex) => {
        const index = MILLION_LADDER_PRIZES.length - 1 - reverseIndex
        const isSafe = index === 4 || index === 9
        const className = [
          index === currentIndex ? 'current' : '',
          index <= reachedIndex ? 'reached' : '',
          isSafe ? 'safe' : '',
        ].filter(Boolean).join(' ')

        return (
          <div className={className} key={prize}>
            <span>{index + 1}</span>
            <strong>{formatPrize(prize)}</strong>
          </div>
        )
      })}
    </div>
  )
}

function AskRoomPoll({ poll }) {
  if (!poll) return null
  const total = poll.reduce((sum, result) => sum + result.votes, 0)

  return (
    <div className="ladder-poll">
      <div className="eyebrow">Ask the Audience</div>
      {poll.map((result) => {
        const percentage = total ? Math.round((result.votes / total) * 100) : 0
        return (
          <div key={result.option}>
            <div><strong>{result.option}</strong><span>{percentage}%</span></div>
            <div className="ladder-poll-track"><span style={{ width: `${percentage}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}

function Lifelines({ lifelines, audienceCount, onUse }) {
  const items = [
    ['fiftyFifty', '50:50', 'Remove two wrong answers'],
    audienceCount
      ? ['askRoom', 'Ask the Audience', `Poll ${audienceCount} audience member${audienceCount === 1 ? '' : 's'}`]
      : ['switchQuestion', 'Switch Question', 'Replace this question with another'],
    ['skipQuestion', 'Skip Question', 'Clear this rung without answering'],
  ]

  return (
    <div className="ladder-lifelines">
      {items.map(([id, label, detail]) => {
        const used = id === 'switchQuestion' ? lifelines.askRoom : lifelines[id]
        return (
          <button
            type="button"
            className={used ? 'used' : ''}
            disabled={used}
            onClick={() => onUse(id)}
            key={id}
          >
            <strong>{label}</strong>
            <span>{used ? 'Used' : detail}</span>
          </button>
        )
      })}
    </div>
  )
}

function Reveal({ state }) {
  const won = state.ladderResult?.won
  const skipped = state.ladderResult?.skipped
  return (
    <div className={`ladder-reveal ${won ? 'won' : 'lost'}`}>
      <div className="eyebrow">
        {skipped ? 'Lifeline used' : won ? 'Correct answer' : 'The ladder ends here'}
      </div>
      {skipped ? (
        <>
          <div className="correct-answer">Question skipped</div>
          <p>The contestant safely progresses to the next rung.</p>
        </>
      ) : (
        <>
          <div className="correct-answer">{state.question.answer}</div>
          <p>{state.question.explanation}</p>
        </>
      )}
      {!state.isHost && state.me?.ladderRole === 'contestant' && !skipped && (
        <div className={`result-banner ${state.me.isCorrect ? 'right' : 'wrong'}`}>
          {state.me.isCorrect
            ? 'Correct — you progress to the next question.'
            : 'Incorrect — your run ends here.'}
        </div>
      )}
    </div>
  )
}

export default function MillionLadderScreen({
  state,
  error,
  onAnswer,
  onReveal,
  onNext,
  onEnd,
  onLifeline,
}) {
  const contestant = state.players.find((player) => player.ladderRole === 'contestant')
  const isLastQuestion = state.questionIndex === state.totalQuestions - 1
  const isContestant = state.me?.ladderRole === 'contestant'
  const isAudience = state.me?.ladderRole === 'audience'

  return (
    <main className="game-shell ladder-shell">
      <header>
        <Logo gameType="million-ladder" />
        <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
      </header>
      <div className="progress-wrap">
        <div className="progress-copy">
          <span>Question {state.questionIndex + 1} of {state.totalQuestions}</span>
          <strong>Playing for {formatPrize(MILLION_LADDER_PRIZES[state.questionIndex])}</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${((state.questionIndex + 1) / state.totalQuestions) * 100}%` }} />
        </div>
      </div>
      <section className="ladder-layout">
        <div className="ladder-main">
          <div className="ladder-heading">
            <div>
              <span>FOR</span>
              <strong>{formatPrize(MILLION_LADDER_PRIZES[state.questionIndex])}</strong>
            </div>
            {state.phase === 'answering' && state.questionEndsAt && (
              <Timer
                key={state.questionEndsAt}
                remainingMs={state.questionTimeRemainingMs}
                durationMs={state.questionDurationMs}
              />
            )}
          </div>
          <h1>{state.question.prompt}</h1>
          {error && <p className="game-error" role="alert">{error}</p>}
          {state.phase === 'answering' ? (
            state.isHost ? (
              <>
                <div className="host-controls ladder-host-controls">
                  <div className="answer-meter">
                    <span style={{ width: contestant?.hasAnswered ? '100%' : '0%' }} />
                  </div>
                  <strong>
                    {contestant?.hasAnswered
                      ? `${contestant.name} has locked in a final answer`
                      : `Waiting for ${contestant?.name || 'the contestant'}`}
                  </strong>
                  {state.ladderLockedAnswer && (
                    <div className="ladder-locked-answer">
                      <span>Final answer</span>
                      <strong>{state.ladderLockedAnswer}</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    className="primary wide"
                    onClick={onReveal}
                    disabled={!contestant?.hasAnswered}
                  >
                    Reveal final answer
                  </button>
                </div>
                <Lifelines
                  lifelines={state.ladderLifelines}
                  audienceCount={state.ladderAudienceCount}
                  onUse={onLifeline}
                />
              </>
            ) : isContestant && state.me?.hasAnswered ? (
              <div className="locked-card ladder-locked">
                <div className="lock-icon">✓</div>
                <div><strong>Final answer</strong><span>Your choice is locked in.</span></div>
              </div>
            ) : isContestant && state.ladderAudienceVotingOpen ? (
              <div className="waiting-banner ladder-audience-wait">
                <span className="spinner" />
                The timer is paused while the audience votes
              </div>
            ) : isAudience && state.me?.hasAnswered ? (
              <div className="locked-card ladder-locked">
                <div className="lock-icon">✓</div>
                <div><strong>Audience vote locked</strong><span>Waiting for the remaining votes.</span></div>
              </div>
            ) : isContestant || (isAudience && state.ladderAudienceVotingOpen) ? (
              <div className="ladder-options">
                {state.question.options.map((option, index) => (
                  <button type="button" key={option} onClick={() => onAnswer(option)}>
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="spectator-card ladder-audience-card">
                <span>◉</span>
                <div>
                  <strong>You’re in the audience</strong>
                  <p>Follow the game here. If Ask the Audience is used, you’ll get a vote.</p>
                </div>
              </div>
            )
          ) : (
            <Reveal state={state} />
          )}
          <AskRoomPoll poll={state.question.poll} />
          {state.phase === 'revealed' && state.isHost && (
            <div className="host-round-actions">
              <button type="button" className="primary" onClick={onNext}>
                {!state.ladderResult?.won
                  ? 'See final winnings'
                  : isLastQuestion
                    ? 'Complete the ladder'
                    : 'Next question'}
              </button>
              {state.ladderResult?.won && !isLastQuestion && (
                <button type="button" className="secondary" onClick={onEnd}>
                  Bank {formatPrize(MILLION_LADDER_PRIZES[state.ladderReached])}
                </button>
              )}
            </div>
          )}
        </div>
        <aside className="ladder-sidebar">
          <div className="eyebrow">Prize ladder</div>
          <PrizeLadder currentIndex={state.questionIndex} reachedIndex={state.ladderReached} />
        </aside>
      </section>
    </main>
  )
}
