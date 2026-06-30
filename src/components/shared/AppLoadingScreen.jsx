import Spinner from './Spinner.jsx'

export default function AppLoadingScreen() {
  return (
    <main className="app-loading-screen" aria-busy="true" aria-live="polite">
      <div className="app-loading-card">
        <Spinner className="app-loading-spinner" />
        <strong>Loading Game Night</strong>
      </div>
    </main>
  )
}
