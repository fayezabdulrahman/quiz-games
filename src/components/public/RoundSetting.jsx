export default function RoundSetting({ title, description, label, value, min, max, onChange, note }) {
  return (
    <div className="host-settings">
      <RoundSettingInner
        title={title}
        description={description}
        label={label}
        value={value}
        min={min}
        max={max}
        onChange={onChange}
      />
      <div className="selected-game-note">{note}</div>
    </div>
  )
}

export function RoundSettingInner({ title, description, label, value, min, max, onChange }) {
  return (
    <div className="settings-heading">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <fieldset className="stepper" aria-label={label}>
        <button
          type="button"
          onClick={() => onChange((count) => Math.max(min, count - 1))}
          disabled={value === min}
          aria-label={`Remove one ${label}`}
        >
          −
        </button>
        <strong>{value}</strong>
        <button
          type="button"
          onClick={() => onChange((count) => Math.min(max, count + 1))}
          disabled={value === max}
          aria-label={`Add one ${label}`}
        >
          +
        </button>
      </fieldset>
    </div>
  )
}
