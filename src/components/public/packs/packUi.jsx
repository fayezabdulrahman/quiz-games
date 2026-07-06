function ActionIcon({ name }) {
  const paths = {
    add: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    delete: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />,
    edit: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM13.5 6.5l4 4" />,
    save: <path d="M5 4h12l2 2v14H5V4ZM8 4v6h8M8 20v-6h8" />,
  }

  return (
    <svg aria-hidden="true" className="pack-action-icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

export function IconButton({ label, icon, variant = 'secondary', ...props }) {
  return (
    <button
      type="button"
      className={`pack-icon-button ${variant}`}
      aria-label={label}
      title={label}
      data-tooltip={label}
      {...props}
    >
      <ActionIcon name={icon} />
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <label className="pack-field">
      <span>{label}</span>
      {children}
    </label>
  )
}
