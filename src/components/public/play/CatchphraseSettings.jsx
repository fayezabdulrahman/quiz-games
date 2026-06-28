import { RoundSettingInner } from '../RoundSetting.jsx'

export default function CatchphraseSettings({
  catchphraseRoundCount,
  setCatchphraseRoundCount,
  catchphraseTimerEnabled,
  setCatchphraseTimerEnabled,
  catchphraseGuessSeconds,
  setCatchphraseGuessSeconds,
}) {
  return (
    <div className="host-settings catchphrase-settings">
      <RoundSettingInner
        title="Puzzle rounds"
        description="Choose how many visual clues to play before final scores."
        label="Say What You See rounds"
        value={catchphraseRoundCount}
        min={3}
        max={20}
        onChange={setCatchphraseRoundCount}
      />
      <div className="settings-heading">
        <div>
          <strong>Buzz answer timer</strong>
          <span>
            {catchphraseTimerEnabled
              ? 'Buzzed-in players must answer before the timer runs out.'
              : 'Off by default; buzzed-in players can think before answering.'}
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
      <div className="selected-game-note catchphrase-note">
        The visual puzzle opens to the room. First player to buzz gets the answer box.
      </div>
    </div>
  )
}
