import { useState } from 'react'
import ContentSelector from '../content/ContentSelector.jsx'
import { RoundSettingInner } from '../public/RoundSetting.jsx'
import PlayerList from '../shared/PlayerList.jsx'
import Spinner from '../shared/Spinner.jsx'
import GameOptionGrid from './GameOptionGrid.jsx'
import GameSettings from './GameSettings.jsx'

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
  const [onePercentRoundCount, setOnePercentRoundCount] = useState(10)
  const [ladderRoundCount, setLadderRoundCount] = useState(15)
  const [surveyRoundCount, setSurveyRoundCount] = useState(6)
  const [quickfireRoundCount, setQuickfireRoundCount] = useState(30)
  const [wordWheelTargetScore, setWordWheelTargetScore] = useState(
    state.gameType === 'word-wheel' ? state.settings?.targetScore || 5 : 5,
  )
  const [questionSeconds, setQuestionSeconds] = useState(state.settings?.questionSeconds || 30)
  const [wordWheelTurnSeconds, setWordWheelTurnSeconds] = useState(
    state.gameType === 'word-wheel' ? state.settings?.turnSeconds || 15 : 15,
  )
  const [wordWheelInputMode, setWordWheelInputMode] = useState(
    state.gameType === 'word-wheel' ? state.settings?.inputMode || 'type' : 'type',
  )
  const [catchphraseTimerEnabled, setCatchphraseTimerEnabled] = useState(
    Boolean(state.settings?.guessTimerEnabled),
  )
  const [catchphraseGuessSeconds, setCatchphraseGuessSeconds] = useState(
    state.settings?.guessSeconds || 10,
  )
  const [contentSelectionMode, setContentSelectionMode] = useState(
    state.settings?.contentSelectionMode || 'official',
  )
  const [preferredQuestionSetId, setPreferredQuestionSetId] = useState(
    state.settings?.preferredQuestionSetId || null,
  )
  const [quizcraftPointsPerCorrect, setQuizcraftPointsPerCorrect] = useState(
    state.gameType === 'quizcraft' ? state.settings?.pointsPerCorrect || 100 : 100,
  )
  const [quizcraftSpeedBonusEnabled, setQuizcraftSpeedBonusEnabled] = useState(
    state.gameType === 'quizcraft' ? state.settings?.speedBonusEnabled !== false : true,
  )
  const [quizcraftMaxSpeedBonus, setQuizcraftMaxSpeedBonus] = useState(
    state.gameType === 'quizcraft' ? state.settings?.maxSpeedBonus || 100 : 100,
  )
  const roundSettings = {
    'one-percent': [onePercentRoundCount, setOnePercentRoundCount, 3, 10, 'Questions'],
    'majority-rules': [majorityRoundCount, setMajorityRoundCount, 3, 20, 'Rounds'],
    'bluff-battle': [bluffRoundCount, setBluffRoundCount, 3, 20, 'Rounds'],
    'million-ladder': [ladderRoundCount, setLadderRoundCount, 5, 15, 'Rungs'],
    'survey-showdown': [surveyRoundCount, setSurveyRoundCount, 3, 12, 'Rounds'],
    'quickfire-30': [quickfireRoundCount, setQuickfireRoundCount, 10, 50, 'Spaces to win'],
    'say-what-you-see': [catchphraseRoundCount, setCatchphraseRoundCount, 3, 20, 'Puzzles'],
    'word-wheel': [wordWheelTargetScore, setWordWheelTargetScore, 1, 10, 'Categories to win'],
  }
  const roundSetting = roundSettings[gameType]
  const [roundCount, setRoundCount, roundMin, roundMax, roundLabel] = roundSetting || []
  const isWordWheel = gameType === 'word-wheel'
  const needsQuizcraftPack = gameType === 'quizcraft' && !preferredQuestionSetId

  const continueToLobby = () => {
    onSelectGame(gameType, {
      lifelineCount,
      lifelinesAnytime,
      diceMode,
      questionSeconds: gameType === 'word-wheel' ? wordWheelTurnSeconds : questionSeconds,
      roundCount:
        gameType === 'majority-rules'
          ? canConfigureMajorityRounds
            ? majorityRoundCount
            : undefined
          : gameType === 'bluff-battle'
            ? bluffRoundCount
            : gameType === 'say-what-you-see'
              ? catchphraseRoundCount
              : gameType === 'one-percent'
                ? onePercentRoundCount
                : gameType === 'million-ladder'
                  ? ladderRoundCount
                  : gameType === 'survey-showdown'
                    ? surveyRoundCount
                    : gameType === 'quickfire-30'
                      ? quickfireRoundCount
                      : gameType === 'word-wheel'
                        ? wordWheelTargetScore
                      : undefined,
      inputMode: wordWheelInputMode,
      guessTimerEnabled: catchphraseTimerEnabled,
      guessSeconds: catchphraseGuessSeconds,
      contentSelectionMode: gameType === 'quizcraft' ? 'user_only' : contentSelectionMode,
      preferredQuestionSetId:
        gameType === 'quizcraft' || contentSelectionMode === 'user_only'
          ? preferredQuestionSetId
          : null,
      pointsPerCorrect: quizcraftPointsPerCorrect,
      speedBonusEnabled: quizcraftSpeedBonusEnabled,
      maxSpeedBonus: quizcraftMaxSpeedBonus,
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
                onSelectGameType={(nextGameType) => {
                  setGameType(nextGameType)
                  setContentSelectionMode(nextGameType === 'quizcraft' ? 'user_only' : 'official')
                  setPreferredQuestionSetId(null)
                }}
              />
              <div className="host-settings room-picker-settings">
                {roundSetting && (gameType !== 'majority-rules' || canConfigureMajorityRounds) && (
                  <RoundSettingInner
                    title={isWordWheel ? 'Winning score' : 'Game length'}
                    description={
                      isWordWheel
                        ? 'Choose how many category rounds a player must win.'
                        : `Choose how many ${roundLabel.toLowerCase()} to play.`
                    }
                    label={roundLabel}
                    value={roundCount}
                    min={roundMin}
                    max={roundMax}
                    onChange={setRoundCount}
                  />
                )}
                <RoundSettingInner
                  title="Round timer"
                  description="Choose the answer time for each timed turn."
                  label={isWordWheel ? 'Seconds per turn' : 'Seconds per round'}
                  value={isWordWheel ? wordWheelTurnSeconds : questionSeconds}
                  min={5}
                  max={isWordWheel ? 60 : 180}
                  step={5}
                  suffix="s"
                  onChange={isWordWheel ? setWordWheelTurnSeconds : setQuestionSeconds}
                />
              </div>
              <GameSettings
                gameType={gameType}
                canConfigureMajorityRounds={canConfigureMajorityRounds}
                lifelineCount={lifelineCount}
                setLifelineCount={setLifelineCount}
                lifelinesAnytime={lifelinesAnytime}
                setLifelinesAnytime={setLifelinesAnytime}
                catchphraseTimerEnabled={catchphraseTimerEnabled}
                setCatchphraseTimerEnabled={setCatchphraseTimerEnabled}
                catchphraseGuessSeconds={catchphraseGuessSeconds}
                setCatchphraseGuessSeconds={setCatchphraseGuessSeconds}
                diceMode={diceMode}
                setDiceMode={setDiceMode}
                wordWheelInputMode={wordWheelInputMode}
                setWordWheelInputMode={setWordWheelInputMode}
                quizcraftPointsPerCorrect={quizcraftPointsPerCorrect}
                setQuizcraftPointsPerCorrect={setQuizcraftPointsPerCorrect}
                quizcraftSpeedBonusEnabled={quizcraftSpeedBonusEnabled}
                setQuizcraftSpeedBonusEnabled={setQuizcraftSpeedBonusEnabled}
                quizcraftMaxSpeedBonus={quizcraftMaxSpeedBonus}
                setQuizcraftMaxSpeedBonus={setQuizcraftMaxSpeedBonus}
              />
              <ContentSelector
                gameType={gameType}
                enabled={Boolean(state.canManageCustomQuestions)}
                selectionMode={contentSelectionMode}
                setSelectionMode={setContentSelectionMode}
                preferredQuestionSetId={preferredQuestionSetId}
                setPreferredQuestionSetId={setPreferredQuestionSetId}
                compact
              />
              {error && <p className="form-error" role="alert">{error}</p>}
              {needsQuizcraftPack && (
                <p className="form-error">Choose a published quiz before continuing.</p>
              )}
              <div className="room-picker-actions">
                <button type="button" className="primary picker-continue" disabled={needsQuizcraftPack} onClick={continueToLobby}>
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
