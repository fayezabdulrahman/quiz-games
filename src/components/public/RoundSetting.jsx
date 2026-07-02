export default function RoundSetting({
  title,
  description,
  label,
  value,
  min,
  max,
  onChange,
  note,
  suffix = '',
  step = 1,
  decrementLabel,
  incrementLabel,
}) {
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
        suffix={suffix}
        step={step}
        decrementLabel={decrementLabel}
        incrementLabel={incrementLabel}
      />
      <div className="selected-game-note">{note}</div>
    </div>
  )
}

export function RoundSettingInner({
  title,
  description,
  label,
  value,
  min,
  max,
  onChange,
  suffix = '',
  step = 1,
  decrementLabel,
  incrementLabel,
}) {
  return (
    <div className="settings-heading">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <fieldset className="stepper" aria-label={label}>
        <button
          type="button"
          onClick={() => onChange((count) => Math.max(min, count - step))}
          disabled={value === min}
          aria-label={decrementLabel || `Remove one ${label}`}
        >
          −
        </button>
        <strong>{value}{suffix}</strong>
        <button
          type="button"
          onClick={() => onChange((count) => Math.min(max, count + step))}
          disabled={value === max}
          aria-label={incrementLabel || `Add one ${label}`}
        >
          +
        </button>
      </fieldset>
    </div>
  )
}
