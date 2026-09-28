import { useEffect, useState } from 'react'
import HostEndGameButton from '../../shared/HostEndGameButton.jsx'
import Logo from '../../shared/Logo.jsx'
import QuestionMedia from '../../shared/QuestionMedia.jsx'

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
      className={`question-timer quizcraft-timer ${seconds <= 10 ? 'urgent' : ''}`}
      style={{ '--timer-progress': `${progress * 360}deg` }}
      role="status"
      aria-label={`${seconds} seconds remaining`}
    >
      <div><strong>{seconds}</strong><span>seconds</span></div>
    </div>
  )
}

function Scoreboard({ players, highlightId }) {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return (
    <div className="quizcraft-score-list">
      {ordered.map((player, index) => (
        <div className={player.id === highlightId ? 'is-me' : ''} key={player.id}>
          <span>{index + 1}</span>
          <strong>{player.name}</strong>
          {player.roundPoints > 0 && <small>+{player.roundPoints}</small>}
          <b>{player.score.toLocaleString()}</b>
        </div>
      ))}
    </div>
  )
}

function AnswerOptions({ options, answer, selectedAnswer, disabled, onAnswer }) {
  return (
    <div className={`quizcraft-options ${options.length === 2 ? 'binary' : ''}`}>
      {options.map((option, index) => {
        const isCorrect = Boolean(answer && option === answer)
        const isSelected = option === selectedAnswer
        const className = [
          isCorrect ? 'correct' : '',
          answer && isSelected && !isCorrect ? 'incorrect' : '',
          isSelected ? 'selected' : '',
        ].filter(Boolean).join(' ')
        return (
          <button
            type="button"
            key={option}
            className={className}
            disabled={disabled}
            onClick={() => onAnswer(option)}
          >
            <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
            <strong>{option}</strong>
            {answer && <small>{isCorrect ? 'Correct' : isSelected ? 'Your answer' : ''}</small>}
          </button>
        )
      })}
    </div>
  )
}

export default function QuizcraftScreen({ state, error, onAnswer, onReveal, onNext, onEnd }) {
  const answered = state.players.filter((player) => player.hasAnswered).length
  const isAnswering = state.phase === 'answering'
  const isLastQuestion = state.questionIndex === state.totalQuestions - 1
  const selectedAnswer = state.me?.submittedAnswer
  const scoringDescription = state.settings.speedBonusEnabled
    ? `${state.settings.pointsPerCorrect} base + up to ${state.settings.maxSpeedBonus} for speed`
    : `${state.settings.pointsPerCorrect} points per correct answer`

  return (
    <main className="game-shell quizcraft-shell">
      <header>
        <Logo gameType="quizcraft" />
        <div className="game-header-actions">
          <HostEndGameButton isHost={state.isHost} onEnd={onEnd} />
          <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
        </div>
      </header>

      <div className="progress-wrap">
        <div className="progress-copy">
          <span>{state.questionIndex + 1} of {state.totalQuestions}</span>
          <strong>Quizcraft</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${((state.questionIndex + 1) / state.totalQuestions) * 100}%` }} />
        </div>
      </div>

      <section className="quizcraft-layout">
        <div className="quizcraft-main">
          <div className="quizcraft-question-heading">
            <div>
              <div className="eyebrow">Choose the best answer</div>
              <span className="quizcraft-scoring-summary">{scoringDescription}</span>
            </div>
            {isAnswering && (
              <Timer
                key={state.questionEndsAt}
                remainingMs={state.questionTimeRemainingMs}
                durationMs={state.questionDurationMs}
              />
            )}
          </div>
          <h1>{state.question.prompt}</h1>
          <QuestionMedia media={state.question.media} />
          {error && <p className="game-error" role="alert">{error}</p>}

          {state.isHost && isAnswering ? (
            <div className="host-controls quizcraft-host-controls">
              <div className="answer-meter">
                <span style={{ width: `${state.players.length ? (answered / state.players.length) * 100 : 0}%` }} />
              </div>
              <strong>{answered} of {state.players.length} players have answered</strong>
              <button type="button" className="primary wide" onClick={onReveal}>
                Reveal answer
              </button>
            </div>
          ) : isAnswering && state.me?.hasAnswered ? (
            <div className="locked-card quizcraft-locked">
              <div className="lock-icon" aria-hidden="true">✓</div>
              <div><strong>Answer locked</strong><span>Waiting for the reveal.</span></div>
            </div>
          ) : (
            <AnswerOptions
              options={state.question.options}
              answer={state.question.answer}
              selectedAnswer={selectedAnswer}
              disabled={state.isHost || !isAnswering}
              onAnswer={onAnswer}
            />
          )}

          {!isAnswering && (
            <div className="quizcraft-reveal" aria-live="polite">
              <div>
                <span>Correct answer</span>
                <strong>{state.question.answer}</strong>
              </div>
              {state.question.explanation && <p>{state.question.explanation}</p>}
              {!state.isHost && (
                <div className={`result-banner ${state.me?.isCorrect ? 'right' : 'wrong'}`}>
                  {state.me?.isCorrect ? (
                    <>
                      <strong>+{state.me.roundPoints} points</strong>
                      <span>
                        {state.settings.speedBonusEnabled
                          ? `${state.me.roundBasePoints} correct + ${state.me.roundSpeedBonus} speed bonus`
                          : 'Correct answer'}
                      </span>
                    </>
                  ) : 'Not this time.'}
                </div>
              )}
            </div>
          )}

          {!isAnswering && state.isHost && (
            <div className="host-round-actions">
              <button type="button" className="primary" onClick={onNext}>
                {isLastQuestion ? 'See final scores' : 'Next question'}
              </button>
            </div>
          )}
        </div>

        <aside className="quizcraft-scoreboard">
          <div className="eyebrow">Live standings</div>
          <h2>Scoreboard</h2>
          <Scoreboard players={state.players} highlightId={state.me?.id} />
        </aside>
      </section>
    </main>
  )
}
