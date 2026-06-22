import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
