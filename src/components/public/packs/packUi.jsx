function ActionIcon({ name }) {
  const paths = {
    add: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    delete: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />,
    draft: <path d="M6 3h8l4 4v7M14 3v5h5M6 3H5v18h8M12 17l5-5 3 3-5 5-4 1 1-4Z" />,
    drag: <path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" />,
    edit: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM13.5 6.5l4 4" />,
    moveDown: <path d="m7 10 5 5 5-5" />,
    moveUp: <path d="m7 14 5-5 5 5" />,
  }

  return (
    <svg aria-hidden="true" className="pack-action-icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

export function IconButton({ label, icon, variant = 'secondary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`pack-icon-button ${variant} ${className}`.trim()}
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
