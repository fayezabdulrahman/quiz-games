import Spinner from '../../shared/Spinner.jsx'
import { packStatusLabels } from './packData.js'

export default function PacksSidebar({
  busy,
  gameType,
  packs,
  packsLoading,
  selectedGame,
  selectedPackId,
  onCreatePack,
  onSelectPack,
}) {
  return (
    <aside className="packs-sidebar">
      <div className="packs-sidebar-action">
        {!packsLoading && !packs.length && (
          <p>
            {gameType
              ? `No custom created packs for ${selectedGame?.name} yet.`
              : 'Select a game card to view its custom created packs.'}
          </p>
        )}
        {!packsLoading && (
          <button type="button" className="primary" onClick={onCreatePack} disabled={busy || !gameType}>
            Create new pack
          </button>
        )}
      </div>
      {packsLoading && (
        <div className="packs-loading">
          <Spinner className="spinner content-spinner" label="Loading custom packs" />
          <span>Loading packs</span>
        </div>
      )}
      {packs.map((pack) => (
        <button
          key={pack.id}
          type="button"
          className={selectedPackId === pack.id ? 'active' : ''}
          onClick={() => onSelectPack(pack.id)}
        >
          <div className="pack-sidebar-title">
            <strong>{pack.title}</strong>
            <span className={`pack-status-pill ${pack.status}`}>
              {packStatusLabels[pack.status] || pack.status}
            </span>
          </div>
          <span>{pack.counts?.active || 0} active · {pack.counts?.draft || 0} drafts</span>
        </button>
      ))}
    </aside>
  )
}
