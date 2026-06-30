import { StrictMode } from 'react'
import { ClerkProvider } from '@clerk/react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'
import './styles/screens/landing.css'
import './styles/screens/lobby.css'
import './styles/screens/room-game-picker.css'
import './styles/game-modes/shared.css'
import './styles/game-modes/one-percent.css'
import './styles/game-modes/majority-rules.css'
import './styles/game-modes/bluff-battle.css'
import './styles/game-modes/million-ladder.css'
import './styles/game-modes/survey-showdown.css'
import './styles/game-modes/quickfire-30.css'
import './styles/game-modes/say-what-you-see.css'
import './styles/theme-game-night.css'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the frontend environment.')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
