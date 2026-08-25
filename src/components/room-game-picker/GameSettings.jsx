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
  catchphraseTimerEnabled,
  setCatchphraseTimerEnabled,
  catchphraseGuessSeconds,
  setCatchphraseGuessSeconds,
  diceMode,
  setDiceMode,
  wordWheelInputMode,
  setWordWheelInputMode,
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
    return null
  }

  if (gameType === 'majority-rules' && canConfigureMajorityRounds) {
    return null
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

  if (gameType === 'word-wheel') {
    return (
      <div className="host-settings room-picker-settings word-wheel-settings">
        <SettingsHeading
          title="Answer mode"
          description="Speak keeps the room honest; type adds a word check before disputes."
        />
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
    )
  }

  return null
}
