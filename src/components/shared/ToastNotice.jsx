export default function ToastNotice({ tone = 'info', title, message, onDismiss }) {
  const className = `public-toast ${tone === 'error' ? 'public-toast-error' : ''}`.trim()

  return (
    <div className={className} role="alert" aria-live="polite">
      <span aria-hidden="true">{tone === 'error' ? '!' : 'i'}</span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onDismiss ? (
        <button type="button" aria-label="Dismiss notice" onClick={onDismiss}>
          x
        </button>
      ) : null}
    </div>
  )
}
