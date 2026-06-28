import { useState } from 'react'

const navItems = [
  ['home', 'Home'],
  ['games', 'Games'],
  ['play', 'Play'],
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
        <span>GAME</span>
        <strong>NIGHT</strong>
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
        Host or join
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
