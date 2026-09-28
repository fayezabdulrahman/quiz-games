import { gameMap } from '../../../data/games.js'
import ContentSelector from '../../content/ContentSelector.jsx'
import { RoundSettingInner } from '../RoundSetting.jsx'
import CatchphraseSettings from './CatchphraseSettings.jsx'
import GamePicker from './GamePicker.jsx'
import OnePercentSettings from './OnePercentSettings.jsx'
import QuickfireSettings from './QuickfireSettings.jsx'
import QuizcraftScoringSettings from '../../shared/QuizcraftScoringSettings.jsx'

export default function HostFields({
  gameType,
  setGameType,
  lifelineCount,
  setLifelineCount,
  lifelinesAnytime,
  setLifelinesAnytime,
  diceMode,
  setDiceMode,
  bluffRoundCount,
  setBluffRoundCount,
  majorityRoundCount,
  setMajorityRoundCount,
  catchphraseRoundCount,
  setCatchphraseRoundCount,
  catchphraseTimerEnabled,
  setCatchphraseTimerEnabled,
  catchphraseGuessSeconds,
  setCatchphraseGuessSeconds,
  onePercentRoundCount,
  setOnePercentRoundCount,
  ladderRoundCount,
  setLadderRoundCount,
  surveyRoundCount,
  setSurveyRoundCount,
  quickfireRoundCount,
  setQuickfireRoundCount,
  wordWheelTargetScore,
  setWordWheelTargetScore,
  questionSeconds,
  setQuestionSeconds,
  wordWheelTurnSeconds,
  setWordWheelTurnSeconds,
  wordWheelInputMode,
  setWordWheelInputMode,
  availableGameTypes,
  canConfigureMajorityRounds,
  canManageCustomQuestions,
  contentSelectionMode,
  setContentSelectionMode,
  preferredQuestionSetId,
  setPreferredQuestionSetId,
  quizcraftPointsPerCorrect,
  setQuizcraftPointsPerCorrect,
  quizcraftSpeedBonusEnabled,
  setQuizcraftSpeedBonusEnabled,
  quizcraftMaxSpeedBonus,
  setQuizcraftMaxSpeedBonus,
}) {
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
  return (
    <>
      <GamePicker
        gameType={gameType}
        setGameType={(nextGameType) => {
          setGameType(nextGameType)
          setContentSelectionMode(nextGameType === 'quizcraft' ? 'user_only' : 'official')
          setPreferredQuestionSetId(null)
        }}
        bluffRoundCount={bluffRoundCount}
        majorityRoundCount={majorityRoundCount}
        catchphraseRoundCount={catchphraseRoundCount}
        availableGameTypes={availableGameTypes}
      />
      <div className="host-settings">
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
          description="Choose the answer time used for each timed turn."
          label={isWordWheel ? 'Seconds per turn' : 'Seconds per round'}
          value={isWordWheel ? wordWheelTurnSeconds : questionSeconds}
          min={5}
          max={isWordWheel ? 60 : 180}
          step={5}
          suffix="s"
          onChange={isWordWheel ? setWordWheelTurnSeconds : setQuestionSeconds}
        />
        <div className="selected-game-note">
          You can still end the game early from the host controls.
        </div>
      </div>
      {gameType === 'one-percent' && (
        <OnePercentSettings
          lifelineCount={lifelineCount}
          setLifelineCount={setLifelineCount}
          lifelinesAnytime={lifelinesAnytime}
          setLifelinesAnytime={setLifelinesAnytime}
        />
      )}
      {gameType === 'quizcraft' && (
        <QuizcraftScoringSettings
          pointsPerCorrect={quizcraftPointsPerCorrect}
          setPointsPerCorrect={setQuizcraftPointsPerCorrect}
          speedBonusEnabled={quizcraftSpeedBonusEnabled}
          setSpeedBonusEnabled={setQuizcraftSpeedBonusEnabled}
          maxSpeedBonus={quizcraftMaxSpeedBonus}
          setMaxSpeedBonus={setQuizcraftMaxSpeedBonus}
        />
      )}
      {gameType === 'majority-rules' && !canConfigureMajorityRounds && (
          <div className="selected-game-note majority-note">
            Majority Rules uses 8 fixed demo rounds. Custom round counts unlock with a paid pack.
          </div>
      )}
      {gameType === 'say-what-you-see' && (
        <CatchphraseSettings
          catchphraseRoundCount={catchphraseRoundCount}
          setCatchphraseRoundCount={setCatchphraseRoundCount}
          catchphraseTimerEnabled={catchphraseTimerEnabled}
          setCatchphraseTimerEnabled={setCatchphraseTimerEnabled}
          catchphraseGuessSeconds={catchphraseGuessSeconds}
          setCatchphraseGuessSeconds={setCatchphraseGuessSeconds}
          showRoundSetting={false}
        />
      )}
      {['million-ladder', 'survey-showdown'].includes(gameType) && (
        <div className={`selected-game-note ${gameMap[gameType].accent}-note`}>
          {gameMap[gameType].summary}
        </div>
      )}
      {gameType === 'quickfire-30' && (
        <QuickfireSettings diceMode={diceMode} setDiceMode={setDiceMode} />
      )}
      {gameType === 'word-wheel' && (
        <div className="host-settings word-wheel-settings">
          <div className="settings-heading">
            <div>
              <strong>Answer mode</strong>
              <span>Speak keeps it social; type adds the word check.</span>
            </div>
          </div>
          <div className="quickfire-dice-options">
            <button
              type="button"
              className={wordWheelInputMode === 'speak' ? 'active' : ''}
              onClick={() => setWordWheelInputMode('speak')}
            >
              Speak
            </button>
            <button
              type="button"
              className={wordWheelInputMode === 'type' ? 'active' : ''}
              onClick={() => setWordWheelInputMode('type')}
            >
              Type
            </button>
          </div>
        </div>
      )}
      <ContentSelector
        gameType={gameType}
        enabled={canManageCustomQuestions}
        selectionMode={contentSelectionMode}
        setSelectionMode={setContentSelectionMode}
        preferredQuestionSetId={preferredQuestionSetId}
        setPreferredQuestionSetId={setPreferredQuestionSetId}
      />
    </>
  )
}
