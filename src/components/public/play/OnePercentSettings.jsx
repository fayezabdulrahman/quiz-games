export default function OnePercentSettings({
  lifelineCount,
  setLifelineCount,
  lifelinesAnytime,
  setLifelinesAnytime,
}) {
  return (
    <div className="host-settings">
      <div className="settings-heading">
        <div>
          <strong>Pass lifelines</strong>
          <span>Applied to every contestant for this round.</span>
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
              : 'Unlocks from the 50% question, like the show.'}
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
