import { useState } from 'react'
import GameOptionGrid from './GameOptionGrid.jsx'
import GameSettings from './GameSettings.jsx'
import PlayerList from '../shared/PlayerList.jsx'
import Spinner from '../shared/Spinner.jsx'

export default function RoomGamePicker({ state, error, onSelectGame, onCloseRoom }) {
  const allowedGameTypes = new Set(state.allowedGameTypes || [])
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
              <GameOptionGrid
                allowedGameTypes={allowedGameTypes}
                selectedGameType={gameType}
                onSelectGameType={setGameType}
              />
              <GameSettings
                gameType={gameType}
                canConfigureMajorityRounds={canConfigureMajorityRounds}
                lifelineCount={lifelineCount}
                setLifelineCount={setLifelineCount}
                lifelinesAnytime={lifelinesAnytime}
                setLifelinesAnytime={setLifelinesAnytime}
                bluffRoundCount={bluffRoundCount}
                setBluffRoundCount={setBluffRoundCount}
                majorityRoundCount={majorityRoundCount}
                setMajorityRoundCount={setMajorityRoundCount}
                catchphraseRoundCount={catchphraseRoundCount}
                setCatchphraseRoundCount={setCatchphraseRoundCount}
                catchphraseTimerEnabled={catchphraseTimerEnabled}
                setCatchphraseTimerEnabled={setCatchphraseTimerEnabled}
                catchphraseGuessSeconds={catchphraseGuessSeconds}
                setCatchphraseGuessSeconds={setCatchphraseGuessSeconds}
                diceMode={diceMode}
                setDiceMode={setDiceMode}
              />
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
              <Spinner />
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
