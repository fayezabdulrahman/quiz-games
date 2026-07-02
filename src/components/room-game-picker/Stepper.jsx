export default function Stepper({
  label,
  value,
  min,
  max,
  decrementLabel,
  incrementLabel,
  onChange,
  suffix = '',
  className = '',
  step = 1,
}) {
  return (
    <fieldset className={['stepper', className].filter(Boolean).join(' ')} aria-label={label}>
      <button
        type="button"
        onClick={() => onChange((current) => Math.max(min, current - step))}
        disabled={value === min}
        aria-label={decrementLabel}
      >
        &minus;
      </button>
      <strong>{value}{suffix}</strong>
      <button
        type="button"
        onClick={() => onChange((current) => Math.min(max, current + step))}
        disabled={value === max}
        aria-label={incrementLabel}
      >
        +
      </button>
    </fieldset>
  )
}
