import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import GamesPage from './public/GamesPage.jsx'
import HomePage from './public/HomePage.jsx'
import PlayPage from './public/PlayPage.jsx'
import PricingPage from './public/PricingPage.jsx'
import PublicFooter from './public/PublicFooter.jsx'
import PublicNav from './public/PublicNav.jsx'

export default function Landing({ onHost, onJoin, busy, error, accountAccess }) {
  const location = useLocation()
  const joinCode = new URLSearchParams(location.search).get('join')

  if (joinCode && location.pathname !== '/play') {
    return <Navigate to={`/play${location.search}`} replace />
  }

  return (
    <main className="public-site">
      <PublicNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/pricing" element={<PricingPage accountAccess={accountAccess} />} />
        <Route
          path="/play"
          element={
            <PlayPage
              onHost={onHost}
              onJoin={onJoin}
              busy={busy}
              error={error}
              accountAccess={accountAccess}
            />
          }
        />
        <Route
          path="/demo"
          element={
            accountAccess?.access?.hasFullAccess ? (
              <Navigate to="/play" replace />
            ) : (
              <PlayPage
                onHost={onHost}
                onJoin={onJoin}
                busy={busy}
                error={error}
                accountAccess={accountAccess}
                demoMode
              />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PublicFooter />
    </main>
  )
}
