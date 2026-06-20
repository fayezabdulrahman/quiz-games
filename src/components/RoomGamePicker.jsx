import { useState } from 'react'
import Logo from './Logo.jsx'
import PlayerList from './PlayerList.jsx'

export default function RoomGamePicker({ state, error, onSelectGame }) {
  const [gameType, setGameType] = useState(state.gameType)
  const [lifelineCount, setLifelineCount] = useState(1)
  const [lifelinesAnytime, setLifelinesAnytime] = useState(false)

  const continueToLobby = () => {
    onSelectGame(gameType, { lifelineCount, lifelinesAnytime })
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
                <button
                  type="button"
                  className={`room-game-card ${gameType === 'one-percent' ? 'selected' : ''}`}
                  onClick={() => setGameType('one-percent')}
                >
                  <Logo />
                  <span>Logic, lifelines and elimination</span>
                </button>
                <button
                  type="button"
                  className={`room-game-card bluff ${gameType === 'bluff-battle' ? 'selected' : ''}`}
                  onClick={() => setGameType('bluff-battle')}
                >
                  <Logo gameType="bluff-battle" />
                  <span>Invent fake answers and fool the room</span>
                </button>
                <button
                  type="button"
                  className={`room-game-card majority ${gameType === 'majority-rules' ? 'selected' : ''}`}
                  onClick={() => setGameType('majority-rules')}
                >
                  <Logo gameType="majority-rules" />
                  <span>Read the room and score points</span>
                </button>
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
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="button" className="primary picker-continue" onClick={continueToLobby}>
                Continue to lobby
              </button>
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
