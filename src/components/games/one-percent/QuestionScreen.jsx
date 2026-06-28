import { useEffect, useState } from 'react'
import HostEndGameButton from '../../HostEndGameButton.jsx'
import Logo from '../../Logo.jsx'
import PlayerList from '../../PlayerList.jsx'

function Progress({ index, total, difficulty }) {
  return (
    <div className="progress-wrap">
      <div className="progress-copy">
        <span>
          Question {index + 1} of {total}
        </span>
        <strong>{difficulty}% question</strong>
      </div>
      <div className="progress-bar">
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
    </div>
  )
}

function QuestionTimer({ remainingMs, durationMs }) {
  const [localEndsAt] = useState(() => Date.now() + remainingMs)
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil(remainingMs / 1000)))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((localEndsAt - Date.now()) / 1000)))
    }, 200)
    return () => window.clearInterval(interval)
  }, [localEndsAt])

  const totalSeconds = durationMs / 1000
  const progress = Math.max(0, Math.min(1, seconds / totalSeconds))

  return (
    <div
      className={`question-timer ${seconds <= 10 ? 'urgent' : ''}`}
      style={{ '--timer-progress': `${progress * 360}deg` }}
      role="status"
      aria-label={`${seconds} seconds remaining`}
    >
      <div>
        <strong>{seconds}</strong>
        <span>seconds</span>
      </div>
    </div>
  )
}

function AnswerControl({ question, player, passAvailable, passUnlocksLater, onSubmit, onPass }) {
  const [answer, setAnswer] = useState('')
  const locked = player?.hasAnswered
  const disabled = !player?.active

  if (locked) {
    return (
      <div className="locked-card">
        <div className="lock-icon">✓</div>
        <div>
          <strong>{player.passedCurrentQuestion ? 'Pass locked in' : 'Answer locked'}</strong>
          <span>
            {player.passedCurrentQuestion
              ? 'Your lifeline keeps you in the game.'
              : 'No changing your mind now.'}
          </span>
        </div>
      </div>
    )
  }

  if (question.type === 'choice') {
    return (
      <>
        {disabled && <SpectatorNotice />}
        <div className={`options ${disabled ? 'spectator-options' : ''}`}>
          {question.options.map((option, index) => (
            <button
              type="button"
              key={option}
              onClick={() => onSubmit(option)}
              disabled={disabled}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          ))}
        </div>
        {!disabled && (
          <LifelineControl
            player={player}
            available={passAvailable}
            unlocksLater={passUnlocksLater}
            onPass={onPass}
          />
        )}
      </>
    )
  }

  if (disabled) return <SpectatorNotice />

  const submitAnswer = (event) => {
    event.preventDefault()
    onSubmit(answer)
  }

  return (
    <>
      <form className="answer-form" onSubmit={submitAnswer}>
        <label htmlFor="answer">Your answer</label>
        <div className="answer-row">
          <input
            id="answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer…"
            autoComplete="off"
          />
          <button type="submit" className="primary" disabled={!answer.trim()}>
            Lock in
          </button>
        </div>
      </form>
      <LifelineControl
        player={player}
        available={passAvailable}
        unlocksLater={passUnlocksLater}
        onPass={onPass}
      />
    </>
  )
}

function SpectatorNotice() {
  return (
    <div className="spectator-card">
      <span>◉</span>
      <div>
        <strong>You’re spectating</strong>
        <p>You can follow the options, but you can’t submit an answer.</p>
      </div>
    </div>
  )
}

function LifelineControl({ player, available, unlocksLater, onPass }) {
  const remaining = player?.lifelinesRemaining ?? 0

  return (
    <div className="lifeline-control">
      <div>
        <span className="lifeline-count">{remaining}</span>
        <span>
          <strong>{remaining === 1 ? 'pass remaining' : 'passes remaining'}</strong>
          <small>
            {unlocksLater
              ? 'Passes unlock at the 50% question.'
              : remaining
                ? 'Skip this question and stay in the game.'
                : 'You have used all your passes.'}
          </small>
        </span>
      </div>
      <button type="button" onClick={onPass} disabled={!available}>
        Use pass
      </button>
    </div>
  )
}

function Reveal({ state }) {
  const correct = state.me?.isCorrect
  const passed = state.me?.passedCurrentQuestion

  return (
    <div className="reveal-card">
      <div className="eyebrow">Correct answer</div>
      <div className="correct-answer">{state.question.answer}</div>
      <p>{state.question.explanation}</p>
      {!state.isHost && state.me && (
        <div className={`result-banner ${correct ? 'right' : 'wrong'}`}>
          {passed
            ? 'Pass used — you’re safely through.'
            : correct
              ? 'You’re through!'
              : 'You’re out — spectator mode activated.'}
        </div>
      )}
    </div>
  )
}

function HostAnswerControls({ answered, playerCount, onReveal }) {
  const answeredPercentage = playerCount ? (answered / playerCount) * 100 : 0

  return (
    <div className="host-controls">
      <div className="answer-meter">
        <span style={{ width: `${answeredPercentage}%` }} />
      </div>
      <strong>
        {answered} of {playerCount} active players locked in
      </strong>
      <button type="button" className="primary wide" onClick={onReveal}>
        Reveal answer
      </button>
    </div>
  )
}

export default function QuestionScreen({ state, error, onAnswer, onPass, onReveal, onNext, onEnd }) {
  const activePlayers = state.players.filter((player) => player.active)
  const answered = activePlayers.filter((player) => player.hasAnswered).length
  const isLastQuestion = state.questionIndex === state.totalQuestions - 1
  const passUnlocksLater = !state.settings.lifelinesAnytime && state.difficulty > 50
  const passAvailable =
    state.me?.active &&
    !state.me?.hasAnswered &&
    state.me?.lifelinesRemaining > 0 &&
    !passUnlocksLater

  return (
    <main className="game-shell">
      <header>
        <Logo />
        <div className="game-header-actions">
          <HostEndGameButton isHost={state.isHost} onEnd={onEnd} />
          <div className="header-room">
            <span>ROOM</span>
            <strong>{state.code}</strong>
          </div>
        </div>
      </header>
      <Progress
        index={state.questionIndex}
        total={state.totalQuestions}
        difficulty={state.difficulty}
      />
      <section className="question-layout">
        <div className="question-main">
          <div className="question-heading-row">
            <div className="question-badge">{state.difficulty}%</div>
            {state.phase === 'answering' && (
              <QuestionTimer
                key={state.questionEndsAt}
                remainingMs={state.questionTimeRemainingMs}
                durationMs={state.questionDurationMs}
              />
            )}
            {!state.isHost && state.me && (
              <div className="lifeline-status">
                <span>{state.me.lifelinesRemaining}</span>
                <div>
                  <strong>
                    {state.me.lifelinesRemaining === 1 ? 'pass left' : 'passes left'}
                  </strong>
                  <small>
                    {passUnlocksLater ? 'Available from 50%' : 'Available now'}
                  </small>
                </div>
              </div>
            )}
          </div>
          <h1>{state.question.prompt}</h1>
          {state.question.detail && <div className="question-detail">{state.question.detail}</div>}
          {error && <p className="game-error" role="alert">{error}</p>}
          {state.phase === 'answering' ? (
            state.isHost ? (
              <HostAnswerControls
                answered={answered}
                playerCount={activePlayers.length}
                onReveal={onReveal}
              />
            ) : (
              <AnswerControl
                key={state.question.id}
                question={state.question}
                player={state.me}
                passAvailable={passAvailable}
                passUnlocksLater={passUnlocksLater}
                onSubmit={onAnswer}
                onPass={onPass}
              />
            )
          ) : (
            <Reveal state={state} />
          )}
          {state.phase === 'revealed' && state.isHost && (
            <div className="host-round-actions">
              <button type="button" className="primary" onClick={onNext}>
                {isLastQuestion ? 'See final results' : 'Next question'}
              </button>
            </div>
          )}
        </div>
        <aside>
          <div className="aside-stat">
            <strong>{activePlayers.length}</strong>
            <span>still standing</span>
          </div>
          <PlayerList players={state.players} compact revealResponses={state.phase === 'revealed'} />
        </aside>
      </section>
    </main>
  )
}
