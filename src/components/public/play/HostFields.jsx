import { gameMap } from '../../../data/games.js'
import RoundSetting from '../RoundSetting.jsx'
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
}) {
  return (
    <>
      <GamePicker
        gameType={gameType}
        setGameType={setGameType}
        bluffRoundCount={bluffRoundCount}
        majorityRoundCount={majorityRoundCount}
        catchphraseRoundCount={catchphraseRoundCount}
      />
      {gameType === 'one-percent' && (
        <OnePercentSettings
          lifelineCount={lifelineCount}
          setLifelineCount={setLifelineCount}
          lifelinesAnytime={lifelinesAnytime}
          setLifelinesAnytime={setLifelinesAnytime}
        />
      )}
      {gameType === 'majority-rules' && (
        <RoundSetting
          title="Majority rounds"
          description="Choose how many room-vote prompts this game will use."
          label="Majority Rules rounds"
          value={majorityRoundCount}
          min={3}
          max={20}
          onChange={setMajorityRoundCount}
          note="Pick the answer you think most of the room will choose. Matching the majority earns one point."
        />
      )}
      {gameType === 'say-what-you-see' && (
        <CatchphraseSettings
          catchphraseRoundCount={catchphraseRoundCount}
          setCatchphraseRoundCount={setCatchphraseRoundCount}
          catchphraseTimerEnabled={catchphraseTimerEnabled}
          setCatchphraseTimerEnabled={setCatchphraseTimerEnabled}
          catchphraseGuessSeconds={catchphraseGuessSeconds}
          setCatchphraseGuessSeconds={setCatchphraseGuessSeconds}
        />
      )}
      {gameType === 'bluff-battle' && (
        <RoundSetting
          title="Bluff rounds"
          description="Choose how many prompts this game will use."
          label="Bluff Battle rounds"
          value={bluffRoundCount}
          min={3}
          max={20}
          onChange={setBluffRoundCount}
          note="Invent a convincing fake answer, find the truth, and score whenever another player falls for your bluff."
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
    </>
  )
}
