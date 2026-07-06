import { useEffect } from 'react'

export default function DeleteConfirmationModal({ confirmation, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!confirmation) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, confirmation, onCancel])

  if (!confirmation) return null

  return (
    <div className="pack-modal-backdrop" role="presentation" onMouseDown={busy ? undefined : onCancel}>
      <section
        aria-labelledby="pack-delete-title"
        aria-describedby="pack-delete-description"
        aria-modal="true"
        className="pack-confirm-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pack-modal-copy">
          <h2 id="pack-delete-title">{confirmation.title}</h2>
          <p id="pack-delete-description">{confirmation.description}</p>
          {confirmation.detail && <strong>{confirmation.detail}</strong>}
        </div>
        <div className="pack-modal-actions">
          <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" disabled={busy} onClick={onConfirm}>
            {busy ? 'Deleting...' : confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
