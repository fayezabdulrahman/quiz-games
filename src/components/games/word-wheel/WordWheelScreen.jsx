import { useEffect, useMemo, useState } from 'react'
import HostEndGameButton from '../../shared/HostEndGameButton.jsx'
import Logo from '../../shared/Logo.jsx'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function firstLetterForWord(value = '') {
  return String(value).trim().match(/[A-Za-z]/)?.[0]?.toUpperCase() || ''
}

function Timer({ remainingMs, durationMs, paused, endsAtMs }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil(remainingMs / 1000)))

  useEffect(() => {
    if (paused || !endsAtMs) return undefined
    const interval = window.setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000)))
    }, 200)
    return () => window.clearInterval(interval)
  }, [endsAtMs, paused])

  const progress = Math.max(0, Math.min(1, seconds / (durationMs / 1000)))

  return (
    <div
      className={`question-timer word-wheel-timer ${seconds <= 5 ? 'urgent' : ''} ${paused ? 'paused' : ''}`}
      style={{ '--timer-progress': `${progress * 360}deg` }}
      role="status"
      aria-label={paused ? 'Timer paused' : `${seconds} seconds remaining`}
    >
      <div>
        <strong>{paused ? 'II' : seconds}</strong>
        <span>{paused ? 'paused' : 'seconds'}</span>
      </div>
    </div>
  )
}

function LetterBoard({ usedLetters, selectedLetter, enabled, onSelect }) {
  const used = new Set(usedLetters)
  return (
    <fieldset className="word-wheel-board">
      <legend className="word-wheel-board-legend">Available letters</legend>
      {alphabet.map((letter) => {
        const isUsed = used.has(letter)
        const isSelected = selectedLetter === letter
        return (
          <button
            key={letter}
            type="button"
            className={`${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}`}
            disabled={!enabled || isUsed}
            onClick={() => onSelect(letter)}
            aria-pressed={isSelected}
          >
            {letter}
          </button>
        )
      })}
    </fieldset>
  )
}

function Scoreboard({ players, activePlayerId, meId, targetScore }) {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return (
    <aside className="word-wheel-side">
      <div className="eyebrow">Cards</div>
      <h2>First to {targetScore}</h2>
      <div className="word-wheel-scoreboard">
        {ordered.map((player) => (
          <div
            key={player.id}
            className={`${player.id === activePlayerId ? 'active' : ''} ${player.id === meId ? 'is-me' : ''} ${!player.active ? 'out' : ''}`}
          >
            <span className="word-wheel-player-status">
              {player.id === activePlayerId ? 'TURN' : player.active ? 'IN' : 'OUT'}
            </span>
            <strong>{player.name}</strong>
            <b>{player.score || 0}</b>
          </div>
        ))}
      </div>
    </aside>
  )
}

function HostControls({
  state,
  onPause,
  onResume,
  onAcceptWord,
  onUndoLast,
  onReturnTurn,
  onEliminate,
}) {
  if (!state.isHost) return null
  const paused = state.phase === 'word-wheel-paused'
  const running = state.phase === 'word-wheel-playing'
  const last = state.wordWheelLastSubmission
  const canDiscuss = running || paused
  const lastNeedsApproval = last?.word && last.dictionaryStatus === 'unrecognized'
  const activePlayerId = state.wordWheelActivePlayerId

  return (
    <div className="host-controls word-wheel-host-controls">
      <div className="word-wheel-host-primary">
        {paused ? (
          <button type="button" className="primary" onClick={onResume}>
            Resume timer
          </button>
        ) : (
          <button type="button" className="secondary" onClick={onPause} disabled={!running}>
            Pause timer
          </button>
        )}
        <button
          type="button"
          className="secondary danger"
          onClick={() => onEliminate(activePlayerId)}
          disabled={!activePlayerId || !canDiscuss}
        >
          Eliminate active
        </button>
      </div>
      {last && (
        <div className="word-wheel-dispute-panel">
          <span>Last claim</span>
          <strong>
            {last.playerName} claimed {last.letter}
            {last.word ? ` with ${last.word}` : ''}
          </strong>
          {lastNeedsApproval && (
            <button type="button" className="primary" onClick={() => onAcceptWord(last.id)}>
              Accept word
            </button>
          )}
          <button type="button" className="secondary" onClick={onUndoLast}>
            Undo letter
          </button>
          <button type="button" className="secondary" onClick={() => onReturnTurn(last.playerId)}>
            Return turn
          </button>
          <button
            type="button"
            className="secondary danger"
            onClick={() => onEliminate(last.playerId)}
          >
            Eliminate player
          </button>
        </div>
      )}
    </div>
  )
}

function SubmissionTrail({ submissions }) {
  if (!submissions?.length) return null
  return (
    <div className="word-wheel-trail">
      {submissions.slice(-8).map((submission) => (
        <span
          key={submission.id}
          className={submission.dictionaryStatus === 'unrecognized' ? 'unrecognized' : ''}
        >
          <b>{submission.letter}</b>
          {submission.word || submission.playerName}
        </span>
      ))}
    </div>
  )
}

export default function WordWheelScreen({
  state,
  error,
  onSubmit,
  onPause,
  onResume,
  onAcceptWord,
  onUndoLast,
  onReturnTurn,
  onEliminate,
  onNextRound,
  onEnd,
}) {
  const [word, setWord] = useState('')
  const [selectedLetter, setSelectedLetter] = useState('')
  const isMyTurn = state.me?.id === state.wordWheelActivePlayerId
  const inputMode = state.settings?.inputMode || 'type'
  const isTypeMode = inputMode === 'type'
  const derivedLetter = useMemo(() => firstLetterForWord(word), [word])
  const letterToSubmit = isTypeMode ? derivedLetter : selectedLetter
  const usedLetters = state.wordWheelUsedLetters || []
  const activePlayerName = state.wordWheelActivePlayerName || 'Next player'
  const paused = state.phase === 'word-wheel-paused'
  const roundOver = state.phase === 'word-wheel-round-over'
  const canSubmit =
    isMyTurn && state.phase === 'word-wheel-playing' && letterToSubmit && (!isTypeMode || word.trim())

  const submitTurn = async () => {
    const result = await onSubmit({ letter: letterToSubmit, word })
    if (result?.ok) {
      setWord('')
      setSelectedLetter('')
    }
  }

  return (
    <main className="game-shell word-wheel-shell">
      <header>
        <Logo gameType="word-wheel" />
        <div className="game-header-actions">
          <HostEndGameButton isHost={state.isHost} onEnd={onEnd} />
          <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
        </div>
      </header>

      <section className="word-wheel-layout">
        <div className="word-wheel-main">
          <div className="word-wheel-topline">
            <div>
              <div className="eyebrow">Category {state.questionIndex + 1}</div>
              <h1>{state.question?.prompt}</h1>
            </div>
            {!roundOver && (
              <Timer
                key={`${state.wordWheelActivePlayerId}-${state.questionEndsAt}-${state.phase}`}
                remainingMs={state.questionTimeRemainingMs || state.wordWheelTimerPausedMs || 0}
                durationMs={state.questionDurationMs}
                paused={paused}
                endsAtMs={state.questionEndsAt}
              />
            )}
          </div>

          {roundOver ? (
            <div className="word-wheel-round-over">
              <div className="eyebrow">Category won</div>
              <h2>{state.wordWheelRoundWinnerName || 'No winner'}</h2>
              {state.isHost ? (
                <button type="button" className="primary" onClick={onNextRound}>
                  Next category
                </button>
              ) : (
                <div className="waiting-banner">Waiting for the host</div>
              )}
            </div>
          ) : (
            <>
              <div className={`word-wheel-turn-card ${isMyTurn ? 'is-my-turn' : ''}`}>
                <span>{paused ? 'Discussion paused' : isMyTurn ? 'Your turn' : 'Current turn'}</span>
                <strong>{paused ? activePlayerName : activePlayerName}</strong>
              </div>

              {isTypeMode && isMyTurn && (
                <label className="word-wheel-word-entry">
                  <span>Your word</span>
                  <input
                    value={word}
                    onChange={(event) => setWord(event.target.value)}
                    placeholder="Type a word"
                    autoComplete="off"
                    disabled={paused}
                  />
                </label>
              )}

              <LetterBoard
                usedLetters={usedLetters}
                selectedLetter={letterToSubmit}
                enabled={isMyTurn && state.phase === 'word-wheel-playing' && !isTypeMode}
                onSelect={setSelectedLetter}
              />

              {isMyTurn && (
                <button
                  type="button"
                  className="primary wide word-wheel-lock"
                  disabled={!canSubmit || usedLetters.includes(letterToSubmit)}
                  onClick={submitTurn}
                >
                  {letterToSubmit ? `Lock ${letterToSubmit}` : 'Choose a letter'}
                </button>
              )}
            </>
          )}

          {error && <p className="game-error" role="alert">{error}</p>}
          <SubmissionTrail submissions={state.wordWheelSubmissions} />
          <HostControls
            state={state}
            onPause={onPause}
            onResume={onResume}
            onAcceptWord={onAcceptWord}
            onUndoLast={onUndoLast}
            onReturnTurn={onReturnTurn}
            onEliminate={onEliminate}
          />
        </div>
        <Scoreboard
          players={state.players}
          activePlayerId={state.wordWheelActivePlayerId}
          meId={state.me?.id}
          targetScore={state.settings?.targetScore || 5}
        />
      </section>
    </main>
  )
}
