import Stepper from './Stepper.jsx'

function SettingsHeading({ title, description, children }) {
  return (
    <div className="settings-heading">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {children}
    </div>
  )
}

export default function GameSettings({
  gameType,
  canConfigureMajorityRounds,
  lifelineCount,
  setLifelineCount,
  lifelinesAnytime,
  setLifelinesAnytime,
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
  diceMode,
  setDiceMode,
}) {
  if (gameType === 'one-percent') {
    return (
      <div className="host-settings room-picker-settings">
        <SettingsHeading title="Pass lifelines" description="Applied to every contestant.">
          <Stepper
            label="Lifelines per player"
            value={lifelineCount}
            min={0}
            max={10}
            decrementLabel="Remove one lifeline"
            incrementLabel="Add one lifeline"
            onChange={setLifelineCount}
          />
        </SettingsHeading>
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
    )
  }

  if (gameType === 'bluff-battle') {
    return (
      <div className="host-settings room-picker-settings">
        <SettingsHeading
          title="Bluff rounds"
          description="Pick how many prompts to play before the final scores."
        >
          <Stepper
            label="Bluff Battle rounds"
            value={bluffRoundCount}
            min={3}
            max={20}
            decrementLabel="Remove one Bluff Battle round"
            incrementLabel="Add one Bluff Battle round"
            onChange={setBluffRoundCount}
          />
        </SettingsHeading>
      </div>
    )
  }

  if (gameType === 'majority-rules' && canConfigureMajorityRounds) {
    return (
      <div className="host-settings room-picker-settings">
        <SettingsHeading
          title="Majority rounds"
          description="Pick how many prompts to play before the final scores."
        >
          <Stepper
            label="Majority Rules rounds"
            value={majorityRoundCount}
            min={3}
            max={20}
            decrementLabel="Remove one Majority Rules round"
            incrementLabel="Add one Majority Rules round"
            onChange={setMajorityRoundCount}
          />
        </SettingsHeading>
      </div>
    )
  }

  if (gameType === 'majority-rules') {
    return (
      <div className="selected-game-note majority-note">
        Majority Rules uses 8 fixed demo rounds. Custom round counts unlock with a paid pack.
      </div>
    )
  }

  if (gameType === 'say-what-you-see') {
    return (
      <div className="host-settings room-picker-settings catchphrase-settings">
        <SettingsHeading
          title="Puzzle rounds"
          description="Pick how many visual clues to play before the final scores."
        >
          <Stepper
            label="Say What You See rounds"
            value={catchphraseRoundCount}
            min={3}
            max={20}
            decrementLabel="Remove one Say What You See round"
            incrementLabel="Add one Say What You See round"
            onChange={setCatchphraseRoundCount}
          />
        </SettingsHeading>
        <SettingsHeading
          title="Buzz answer timer"
          description={
            catchphraseTimerEnabled
              ? 'Timeouts void the guess and reopen the puzzle.'
              : 'Leave untimed, or turn on a buzz-answer limit.'
          }
        >
          <button
            type="button"
            className={`catchphrase-timer-toggle ${catchphraseTimerEnabled ? 'active' : ''}`}
            onClick={() => setCatchphraseTimerEnabled((enabled) => !enabled)}
            aria-pressed={catchphraseTimerEnabled}
          >
            {catchphraseTimerEnabled ? 'Timer on' : 'Timer off'}
          </button>
        </SettingsHeading>
        {catchphraseTimerEnabled && (
          <Stepper
            className="catchphrase-timer-stepper"
            label="Seconds per buzzed guess"
            value={catchphraseGuessSeconds}
            min={5}
            max={30}
            decrementLabel="Remove one second"
            incrementLabel="Add one second"
            onChange={setCatchphraseGuessSeconds}
            suffix="s"
          />
        )}
      </div>
    )
  }

  if (gameType === 'quickfire-30') {
    return (
      <div className="host-settings room-picker-settings quickfire-settings">
        <SettingsHeading
          title="Choose the die"
          description="Digital rolls in the app; physical lets the player enter 0, 1 or 2."
        />
        <div className="quickfire-dice-options">
          <button
            type="button"
            className={diceMode === 'digital' ? 'active' : ''}
            onClick={() => setDiceMode('digital')}
          >
            Digital
          </button>
          <button
            type="button"
            className={diceMode === 'manual' ? 'active' : ''}
            onClick={() => setDiceMode('manual')}
          >
            Physical
          </button>
        </div>
      </div>
    )
  }

  return null
}
