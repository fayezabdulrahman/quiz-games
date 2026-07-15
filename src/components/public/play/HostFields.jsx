import { gameMap } from '../../../data/games.js'
import ContentSelector from '../../content/ContentSelector.jsx'
import { RoundSettingInner } from '../RoundSetting.jsx'
import CatchphraseSettings from './CatchphraseSettings.jsx'
import GamePicker from './GamePicker.jsx'
import OnePercentSettings from './OnePercentSettings.jsx'
import QuickfireSettings from './QuickfireSettings.jsx'

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
  questionSeconds,
  setQuestionSeconds,
  availableGameTypes,
  canConfigureMajorityRounds,
  canManageCustomQuestions,
  contentSelectionMode,
  setContentSelectionMode,
  preferredQuestionSetId,
  setPreferredQuestionSetId,
}) {
  const roundSettings = {
    'one-percent': [onePercentRoundCount, setOnePercentRoundCount, 3, 10, 'Questions'],
    'majority-rules': [majorityRoundCount, setMajorityRoundCount, 3, 20, 'Rounds'],
    'bluff-battle': [bluffRoundCount, setBluffRoundCount, 3, 20, 'Rounds'],
    'million-ladder': [ladderRoundCount, setLadderRoundCount, 5, 15, 'Rungs'],
    'survey-showdown': [surveyRoundCount, setSurveyRoundCount, 3, 12, 'Rounds'],
    'quickfire-30': [quickfireRoundCount, setQuickfireRoundCount, 10, 50, 'Spaces to win'],
    'say-what-you-see': [catchphraseRoundCount, setCatchphraseRoundCount, 3, 20, 'Puzzles'],
  }
  const [roundCount, setRoundCount, roundMin, roundMax, roundLabel] = roundSettings[gameType]
  return (
    <>
      <GamePicker
        gameType={gameType}
        setGameType={setGameType}
        bluffRoundCount={bluffRoundCount}
        majorityRoundCount={majorityRoundCount}
        catchphraseRoundCount={catchphraseRoundCount}
        availableGameTypes={availableGameTypes}
      />
      <div className="host-settings">
        {(gameType !== 'majority-rules' || canConfigureMajorityRounds) && (
          <RoundSettingInner
            title="Game length"
            description={`Choose how many ${roundLabel.toLowerCase()} to play.`}
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
          label="Seconds per round"
          value={questionSeconds}
          min={5}
          max={180}
          step={5}
          suffix="s"
          onChange={setQuestionSeconds}
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
