import GamesPage from './public/GamesPage.jsx'
import HomePage from './public/HomePage.jsx'
import PlayPage from './public/PlayPage.jsx'
import PricingPage from './public/PricingPage.jsx'
import PublicFooter from './public/PublicFooter.jsx'
import PublicNav from './public/PublicNav.jsx'

export default function Landing({ page, setPage, onHost, onJoin, busy, error }) {
  return (
    <main className="public-site">
      <PublicNav page={page} setPage={setPage} />
      {page === 'games' ? (
        <GamesPage setPage={setPage} />
      ) : page === 'pricing' ? (
        <PricingPage setPage={setPage} />
      ) : page === 'play' ? (
        <PlayPage onHost={onHost} onJoin={onJoin} busy={busy} error={error} />
      ) : (
        <HomePage setPage={setPage} />
      )}
      <PublicFooter />
    </main>
  )
}
