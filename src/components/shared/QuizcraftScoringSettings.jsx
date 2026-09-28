import { RoundSettingInner } from '../public/RoundSetting.jsx'

export default function QuizcraftScoringSettings({
  pointsPerCorrect,
  setPointsPerCorrect,
  speedBonusEnabled,
  setSpeedBonusEnabled,
  maxSpeedBonus,
  setMaxSpeedBonus,
  compact = false,
}) {
  const maximumScore = pointsPerCorrect + (speedBonusEnabled ? maxSpeedBonus : 0)

  return (
    <div className={`host-settings quizcraft-scoring-settings ${compact ? 'room-picker-settings' : ''}`}>
      <RoundSettingInner
        title="Correct answer value"
        description="Every correct answer earns this many points."
        label="Points per correct answer"
        value={pointsPerCorrect}
        min={50}
        max={1000}
        step={50}
        suffix=" pts"
        decrementLabel="Reduce correct answer points"
        incrementLabel="Increase correct answer points"
        onChange={setPointsPerCorrect}
      />
      <label className="toggle-row">
        <span>
          <strong>Speed bonus</strong>
          <small>
            {speedBonusEnabled
              ? 'Faster correct answers earn more.'
              : 'All correct answers earn the same score.'}
          </small>
        </span>
        <input
          type="checkbox"
          checked={speedBonusEnabled}
          onChange={(event) => setSpeedBonusEnabled(event.target.checked)}
        />
        <span className="toggle" aria-hidden="true" />
      </label>
      {speedBonusEnabled && (
        <RoundSettingInner
          title="Maximum speed bonus"
          description="The bonus falls steadily as the timer runs down."
          label="Maximum speed bonus"
          value={maxSpeedBonus}
          min={50}
          max={1000}
          step={50}
          suffix=" pts"
          decrementLabel="Reduce maximum speed bonus"
          incrementLabel="Increase maximum speed bonus"
          onChange={setMaxSpeedBonus}
        />
      )}
      <div className="quizcraft-score-example">
        A correct answer can earn up to <strong>{maximumScore} points</strong>.
      </div>
    </div>
  )
}
