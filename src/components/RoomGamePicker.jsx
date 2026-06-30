import { useState } from 'react'
import Logo from './Logo.jsx'
import PlayerList from './PlayerList.jsx'

export default function RoomGamePicker({ state, error, onSelectGame, onCloseRoom }) {
  const allowedGameTypes = new Set(state.allowedGameTypes || [])
  const canShowGame = (id) => allowedGameTypes.size === 0 || allowedGameTypes.has(id)
  const canConfigureMajorityRounds = state.accessMode !== 'demo'
  const [gameType, setGameType] = useState(state.gameType)
  const [lifelineCount, setLifelineCount] = useState(1)
  const [lifelinesAnytime, setLifelinesAnytime] = useState(false)
  const [diceMode, setDiceMode] = useState('digital')
  const [majorityRoundCount, setMajorityRoundCount] = useState(
    state.gameType === 'majority-rules' ? state.settings?.roundCount || 8 : 8,
  )
  const [bluffRoundCount, setBluffRoundCount] = useState(
    state.gameType === 'bluff-battle' ? state.settings?.roundCount || 6 : 6,
  )
  const [catchphraseRoundCount, setCatchphraseRoundCount] = useState(
    state.gameType === 'say-what-you-see' ? state.settings?.roundCount || 10 : 10,
  )
  const [catchphraseTimerEnabled, setCatchphraseTimerEnabled] = useState(
    Boolean(state.settings?.guessTimerEnabled),
  )
  const [catchphraseGuessSeconds, setCatchphraseGuessSeconds] = useState(
    state.settings?.guessSeconds || 10,
  )

  const continueToLobby = () => {
    onSelectGame(gameType, {
      lifelineCount,
      lifelinesAnytime,
      diceMode,
      roundCount:
        gameType === 'majority-rules'
          ? canConfigureMajorityRounds
            ? majorityRoundCount
            : undefined
          : gameType === 'bluff-battle'
            ? bluffRoundCount
            : gameType === 'say-what-you-see'
              ? catchphraseRoundCount
              : undefined,
      guessTimerEnabled: catchphraseTimerEnabled,
      guessSeconds: catchphraseGuessSeconds,
    })
  }

  return (
    <main className="game-shell room-game-picker">
      <header>
        <div className="game-night-mini">GAME NIGHT</div>
        <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
      </header>
      <section className="room-picker-layout">
        <div>
          <div className="eyebrow">Same room, next game</div>
          <h1>What are we playing next?</h1>
          <p>
            Everyone stays connected and the room code remains <strong>{state.code}</strong>.
          </p>
          {state.isHost ? (
            <>
              <div className="room-game-grid">
                {canShowGame('quickfire-30') && (
                  <button
                    type="button"
                    className={`room-game-card quickfire ${gameType === 'quickfire-30' ? 'selected' : ''}`}
                    onClick={() => setGameType('quickfire-30')}
                  >
                    <Logo gameType="quickfire-30" />
                    <span>Two teams describe five names against the clock</span>
                  </button>
                )}
                {canShowGame('say-what-you-see') && (
                  <button
                    type="button"
                    className={`room-game-card catchphrase ${gameType === 'say-what-you-see' ? 'selected' : ''}`}
                    onClick={() => setGameType('say-what-you-see')}
                  >
                    <Logo gameType="say-what-you-see" />
                    <span>Visual puzzles, buzzers and fast guesses</span>
                  </button>
                )}
                {canShowGame('one-percent') && (
                  <button
                    type="button"
                    className={`room-game-card ${gameType === 'one-percent' ? 'selected' : ''}`}
                    onClick={() => setGameType('one-percent')}
                  >
                    <Logo />
                    <span>Logic, lifelines and elimination</span>
                  </button>
                )}
                {canShowGame('bluff-battle') && (
                  <button
                    type="button"
                    className={`room-game-card bluff ${gameType === 'bluff-battle' ? 'selected' : ''}`}
                    onClick={() => setGameType('bluff-battle')}
                  >
                    <Logo gameType="bluff-battle" />
                    <span>Invent fake answers and fool the room</span>
                  </button>
                )}
                {canShowGame('majority-rules') && (
                  <button
                    type="button"
                    className={`room-game-card majority ${gameType === 'majority-rules' ? 'selected' : ''}`}
                    onClick={() => setGameType('majority-rules')}
                  >
                    <Logo gameType="majority-rules" />
                    <span>Read the room and score points</span>
                  </button>
                )}
                {canShowGame('million-ladder') && (
                  <button
                    type="button"
                    className={`room-game-card ladder ${gameType === 'million-ladder' ? 'selected' : ''}`}
                    onClick={() => setGameType('million-ladder')}
                  >
                    <Logo gameType="million-ladder" />
                    <span>One contestant takes on the prize ladder</span>
                  </button>
                )}
                {canShowGame('survey-showdown') && (
                  <button
                    type="button"
                    className={`room-game-card survey ${gameType === 'survey-showdown' ? 'selected' : ''}`}
                    onClick={() => setGameType('survey-showdown')}
                  >
                    <Logo gameType="survey-showdown" />
                    <span>Two teams uncover answers, strike out and steal</span>
                  </button>
                )}
              </div>
              {gameType === 'one-percent' && (
                <div className="host-settings room-picker-settings">
                  <div className="settings-heading">
                    <div>
                      <strong>Pass lifelines</strong>
                      <span>Applied to every contestant.</span>
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
                          : 'Unlocks from the 50% question.'}
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
              {gameType === 'bluff-battle' && (
                <div className="host-settings room-picker-settings">
                  <div className="settings-heading">
                    <div>
                      <strong>Bluff rounds</strong>
                      <span>Pick how many prompts to play before the final scores.</span>
                    </div>
                    <fieldset className="stepper" aria-label="Bluff Battle rounds">
                      <button
                        type="button"
                        onClick={() => setBluffRoundCount((count) => Math.max(3, count - 1))}
                        disabled={bluffRoundCount === 3}
                        aria-label="Remove one Bluff Battle round"
                      >
                        −
                      </button>
                      <strong>{bluffRoundCount}</strong>
                      <button
                        type="button"
                        onClick={() => setBluffRoundCount((count) => Math.min(20, count + 1))}
                        disabled={bluffRoundCount === 20}
                        aria-label="Add one Bluff Battle round"
                      >
                        +
                      </button>
                    </fieldset>
                  </div>
                </div>
              )}
              {gameType === 'majority-rules' && canConfigureMajorityRounds && (
                <div className="host-settings room-picker-settings">
                  <div className="settings-heading">
                    <div>
                      <strong>Majority rounds</strong>
                      <span>Pick how many prompts to play before the final scores.</span>
                    </div>
                    <fieldset className="stepper" aria-label="Majority Rules rounds">
                      <button
                        type="button"
                        onClick={() => setMajorityRoundCount((count) => Math.max(3, count - 1))}
                        disabled={majorityRoundCount === 3}
                        aria-label="Remove one Majority Rules round"
                      >
                        −
                      </button>
                      <strong>{majorityRoundCount}</strong>
                      <button
                        type="button"
                        onClick={() => setMajorityRoundCount((count) => Math.min(20, count + 1))}
                        disabled={majorityRoundCount === 20}
                        aria-label="Add one Majority Rules round"
                      >
                        +
                      </button>
                    </fieldset>
                  </div>
                </div>
              )}
              {gameType === 'majority-rules' && !canConfigureMajorityRounds && (
                <div className="selected-game-note majority-note">
                  Majority Rules uses 8 fixed demo rounds. Custom round counts unlock with a paid pack.
                </div>
              )}
              {gameType === 'say-what-you-see' && (
                <div className="host-settings room-picker-settings catchphrase-settings">
                  <div className="settings-heading">
                    <div>
                      <strong>Puzzle rounds</strong>
                      <span>Pick how many visual clues to play before the final scores.</span>
                    </div>
                    <fieldset className="stepper" aria-label="Say What You See rounds">
                      <button
                        type="button"
                        onClick={() => setCatchphraseRoundCount((count) => Math.max(3, count - 1))}
                        disabled={catchphraseRoundCount === 3}
                        aria-label="Remove one Say What You See round"
                      >
                        −
                      </button>
                      <strong>{catchphraseRoundCount}</strong>
                      <button
                        type="button"
                        onClick={() => setCatchphraseRoundCount((count) => Math.min(20, count + 1))}
                        disabled={catchphraseRoundCount === 20}
                        aria-label="Add one Say What You See round"
                      >
                        +
                      </button>
                    </fieldset>
                  </div>
                  <div className="settings-heading">
                    <div>
                      <strong>Buzz answer timer</strong>
                      <span>
                        {catchphraseTimerEnabled
                          ? 'Timeouts void the guess and reopen the puzzle.'
                          : 'Leave untimed, or turn on a buzz-answer limit.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`catchphrase-timer-toggle ${catchphraseTimerEnabled ? 'active' : ''}`}
                      onClick={() => setCatchphraseTimerEnabled((enabled) => !enabled)}
                      aria-pressed={catchphraseTimerEnabled}
                    >
                      {catchphraseTimerEnabled ? 'Timer on' : 'Timer off'}
                    </button>
                  </div>
                  {catchphraseTimerEnabled && (
                    <fieldset className="stepper catchphrase-timer-stepper" aria-label="Seconds per buzzed guess">
                      <button
                        type="button"
                        onClick={() => setCatchphraseGuessSeconds((seconds) => Math.max(5, seconds - 1))}
                        disabled={catchphraseGuessSeconds === 5}
                        aria-label="Remove one second"
                      >
                        −
                      </button>
                      <strong>{catchphraseGuessSeconds}s</strong>
                      <button
                        type="button"
                        onClick={() => setCatchphraseGuessSeconds((seconds) => Math.min(30, seconds + 1))}
                        disabled={catchphraseGuessSeconds === 30}
                        aria-label="Add one second"
                      >
                        +
                      </button>
                    </fieldset>
                  )}
                </div>
              )}
              {gameType === 'quickfire-30' && (
                <div className="host-settings room-picker-settings quickfire-settings">
                  <div className="settings-heading">
                    <div>
                      <strong>Choose the die</strong>
                      <span>Digital rolls in the app; physical lets the player enter 0, 1 or 2.</span>
                    </div>
                  </div>
                  <div className="quickfire-dice-options">
                    <button type="button" className={diceMode === 'digital' ? 'active' : ''}
                      onClick={() => setDiceMode('digital')}>Digital</button>
                    <button type="button" className={diceMode === 'manual' ? 'active' : ''}
                      onClick={() => setDiceMode('manual')}>Physical</button>
                  </div>
                </div>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="room-picker-actions">
                <button type="button" className="primary picker-continue" onClick={continueToLobby}>
                  Continue to lobby
                </button>
                {state.players.length > 0 && (
                  <button
                    type="button"
                    className="secondary danger picker-close"
                    onClick={onCloseRoom}
                  >
                    Close room
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="waiting-banner">
              <span className="spinner" />
              The host is choosing the next game
            </div>
          )}
        </div>
        <aside>
          <div className="eyebrow">Still in the room</div>
          <h2>{state.players.length} players</h2>
          <PlayerList players={state.players} compact />
        </aside>
      </section>
    </main>
  )
}
