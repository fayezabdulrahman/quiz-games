import { Show, SignInButton, UserButton } from '@clerk/react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  ['/games', 'Games'],
  ['/pricing', 'Pricing'],
]

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <header className={`public-nav ${menuOpen ? 'menu-open' : ''}`}>
      <Link className="public-brand" to="/" onClick={closeMenu}>
        <strong>Game Night</strong>
      </Link>
      <nav id="public-navigation" aria-label="Main navigation">
        <Show when="signed-out">
          <NavLink to="/" end onClick={closeMenu}>
            How it works
          </NavLink>
        </Show>
        <Show when="signed-in">
          <NavLink to="/play" onClick={closeMenu}>
            Play
          </NavLink>
        </Show>
        {navItems.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeMenu}
          >
            {label}
          </NavLink>
        ))}
        <Show when="signed-in">
          <NavLink className="nav-account-link" to="/packs" onClick={closeMenu}>
            My Packs
          </NavLink>
        </Show>
      </nav>
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <button type="button" className="nav-play-button">
            Login
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <div className="nav-account">
          <UserButton />
        </div>
      </Show>
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
