import { useEffect, useState } from 'react'
import HostEndGameButton from '../../shared/HostEndGameButton.jsx'
import Logo from '../../shared/Logo.jsx'
import Spinner from '../../shared/Spinner.jsx'

function Countdown({ endsAt }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))

  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    tick()
    const timer = window.setInterval(tick, 150)
    return () => window.clearInterval(timer)
  }, [endsAt])

  return (
    <div className={`quickfire-clock ${seconds <= 10 ? 'urgent' : ''}`} role="timer">
      <strong>{seconds}</strong>
      <span>seconds</span>
    </div>
  )
}

function RaceBoard({ teams, boardLength }) {
  const spaces = Array.from({ length: boardLength + 1 }, (_, index) => index)
  return (
    <div className="quickfire-board-wrap">
      <div className="quickfire-board" role="img" aria-label="Race board">
        {spaces.map((space) => (
          <div className={`quickfire-space ${space === 0 ? 'start' : ''} ${space === boardLength ? 'finish' : ''}`} key={space}>
            <span>{space === 0 ? 'S' : space === boardLength ? 'F' : space}</span>
            <div className="quickfire-pieces">
              {teams.filter((team) => team.position === space).map((team) => (
                <i className={team.id} key={team.id} title={team.name} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamStatus({ team, players, active }) {
  const names = players
    .filter((player) => team.playerIds.includes(player.id))
    .map((player) => player.name)
  return (
    <div className={`quickfire-team-status ${team.id} ${active ? 'active' : ''}`}>
      <div><span>{team.name}</span><strong>{team.position}</strong></div>
      <p>{names.join(' · ')}</p>
    </div>
  )
}

export default function Quickfire30Screen({
  state,
  error,
  onRoll,
  onDraw,
  onScore,
  onNext,
  onEnd,
}) {
  const [rolling, setRolling] = useState(false)
  const [selection, setSelection] = useState({ cardId: null, indexes: [] })
  const activeTeam = state.quickfireTeams.find((team) => team.id === state.quickfireActiveTeamId)
  const activePlayer = state.players.find((player) => player.id === state.quickfireActivePlayerId)
  const isDescriber = state.me?.id === state.quickfireActivePlayerId
  const cardTerms = state.question?.terms || []
  const selected =
    selection.cardId === state.question?.id ? selection.indexes : []

  const rollDigital = () => {
    setRolling(true)
    window.setTimeout(async () => {
      await onRoll()
      setRolling(false)
    }, 850)
  }

  const toggleAnswer = (index) => {
    setSelection((current) => {
      const indexes = current.cardId === state.question?.id ? current.indexes : []
      return {
        cardId: state.question?.id,
        indexes: indexes.includes(index)
          ? indexes.filter((item) => item !== index)
          : [...indexes, index],
      }
    })
  }

  const phaseCopy = {
    'quickfire-roll': 'Roll before the card',
    'quickfire-ready': 'The handicap is set',
    'quickfire-describing': 'Describe. Guess. Keep moving.',
    'quickfire-scoring': 'Time. Mark the correct answers.',
    'quickfire-result': 'Turn complete',
  }[state.phase]

  return (
    <main className="game-shell quickfire-shell">
      <header>
        <Logo gameType="quickfire-30" />
        <div className="game-header-actions">
          <HostEndGameButton isHost={state.isHost} onEnd={onEnd} />
          <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
        </div>
      </header>
      <section className="quickfire-score-strip">
        {state.quickfireTeams.map((team) => (
          <TeamStatus
            key={team.id}
            team={team}
            players={state.players}
            active={team.id === activeTeam?.id}
          />
        ))}
      </section>
      <RaceBoard teams={state.quickfireTeams} boardLength={state.settings.boardLength} />
      <section className="quickfire-play-panel">
        <div className="quickfire-turn-heading">
          <div>
            <div className="eyebrow">{activeTeam?.name} · {phaseCopy}</div>
            <h1>{activePlayer?.name} is describing</h1>
          </div>
          {state.phase === 'quickfire-describing' ? (
            <Countdown endsAt={state.questionEndsAt} />
          ) : state.quickfireDie !== null ? (
            <div className="quickfire-die-result"><span>HANDICAP</span><strong>{state.quickfireDie}</strong></div>
          ) : null}
        </div>

        {state.phase === 'quickfire-roll' && (
          isDescriber ? (
            <div className="quickfire-roll-panel">
              {state.settings.diceMode === 'digital' ? (
                <>
                  <div className={`quickfire-die ${rolling ? 'rolling' : ''}`}>
                    <span>{rolling ? '?' : '0·1·2'}</span>
                  </div>
                  <button type="button" className="primary" onClick={rollDigital} disabled={rolling}>
                    {rolling ? 'Rolling…' : 'Roll the die'}
                  </button>
                </>
              ) : (
                <>
                  <p>Roll your physical die, then enter the result.</p>
                  <div className="quickfire-manual-die">
                    {[0, 1, 2].map((value) => (
                      <button type="button" key={value} onClick={() => onRoll(value)}>{value}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="waiting-banner"><Spinner />{activePlayer?.name} is rolling the die</div>
          )
        )}

        {state.phase === 'quickfire-ready' && (
          isDescriber ? (
            <div className="quickfire-ready-card">
              <strong>Ready?</strong>
              <p>The five answers appear only after you press the button. The shared 30-second clock starts immediately.</p>
              <button type="button" className="primary" onClick={onDraw}>Draw card & start</button>
            </div>
          ) : (
            <div className="waiting-banner"><Spinner />Waiting for {activePlayer?.name} to draw the card</div>
          )
        )}

        {state.phase === 'quickfire-describing' && (
          isDescriber ? (
            <div className="quickfire-answer-card">
              <div><span>ANY ORDER</span><strong>Do not say any printed word</strong></div>
              <ol>{cardTerms.map((term) => <li key={term}>{term}</li>)}</ol>
            </div>
          ) : (
            <div className="quickfire-listen-card">
              <strong>Guess out loud!</strong>
              <p>The card stays private on {activePlayer?.name}’s device while the clock runs.</p>
            </div>
          )
        )}

        {state.phase === 'quickfire-scoring' && (
          <div className="quickfire-scoring">
            <div className="quickfire-answer-card revealed">
              <div><span>HONOUR SYSTEM</span><strong>Select every answer the team guessed</strong></div>
              <ol>
                {cardTerms.map((term, index) => (
                  <li key={term}>
                    <button
                      type="button"
                      className={selected.includes(index) ? 'selected' : ''}
                      disabled={!isDescriber}
                      onClick={() => toggleAnswer(index)}
                    >
                      <span>{selected.includes(index) ? '✓' : index + 1}</span>{term}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            {isDescriber ? (
              <button type="button" className="primary wide" onClick={() => onScore(selected)}>
                Confirm {selected.length} correct · move {Math.max(0, selected.length - state.quickfireDie)}
              </button>
            ) : (
              <div className="waiting-banner">Waiting for {activePlayer?.name} to confirm the score</div>
            )}
          </div>
        )}

        {state.phase === 'quickfire-result' && (
          <div className="quickfire-result-card">
            <div className={`quickfire-result-piece ${state.quickfireLastMove.teamId}`} />
            <div>
              <div className="eyebrow">{activeTeam?.name}</div>
              <h2>Move {state.quickfireLastMove.move} {state.quickfireLastMove.move === 1 ? 'space' : 'spaces'}</h2>
              <p>{state.quickfireLastMove.correctCount} correct − die {state.quickfireLastMove.die}</p>
            </div>
            {state.isHost ? (
              <button type="button" className="primary" onClick={onNext}>Next team</button>
            ) : (
              <span>Waiting for the host</span>
            )}
          </div>
        )}

        {error && <p className="game-error" role="alert">{error}</p>}
      </section>
    </main>
  )
}
