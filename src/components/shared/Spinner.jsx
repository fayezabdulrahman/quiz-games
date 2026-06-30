export default function Spinner({ className = 'spinner', label = 'Loading' }) {
  return <span className={className} aria-label={label} role="status" />
}
