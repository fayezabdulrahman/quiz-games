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
}) {
  return (
    <fieldset className={['stepper', className].filter(Boolean).join(' ')} aria-label={label}>
      <button
        type="button"
        onClick={() => onChange((current) => Math.max(min, current - 1))}
        disabled={value === min}
        aria-label={decrementLabel}
      >
        &minus;
      </button>
      <strong>{value}{suffix}</strong>
      <button
        type="button"
        onClick={() => onChange((current) => Math.min(max, current + 1))}
        disabled={value === max}
        aria-label={incrementLabel}
      >
        +
      </button>
    </fieldset>
  )
}
