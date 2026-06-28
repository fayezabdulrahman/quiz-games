import { useState } from 'react'

const navItems = [
  ['home', 'How it works'],
  ['games', 'Games'],
  ['play', 'Join'],
]

export default function PublicNav({ page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const selectPage = (id) => {
    setPage(id)
    setMenuOpen(false)
  }

  return (
    <header className={`public-nav ${menuOpen ? 'menu-open' : ''}`}>
      <button type="button" className="public-brand" onClick={() => selectPage('home')}>
        <strong>Game Night</strong>
      </button>
      <nav id="public-navigation" aria-label="Main navigation">
        {navItems.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={page === id ? 'active' : ''}
            onClick={() => selectPage(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <button type="button" className="nav-play-button" onClick={() => selectPage('play')}>
        Host a room
      </button>
      <button
        type="button"
        className={`menu-toggle ${menuOpen ? 'open' : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-controls="public-navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="menu-line menu-line-top" />
        <span className="menu-line menu-line-middle" />
        <span className="menu-line menu-line-bottom" />
      </button>
    </header>
  )
}
