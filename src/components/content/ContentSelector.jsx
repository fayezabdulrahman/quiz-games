import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentOptionsPath, contentRequest } from '../../lib/contentApi.js'
import Spinner from '../shared/Spinner.jsx'

const modeLabels = {
  official: 'Official',
  mixed: 'Mixed',
  user_only: 'Custom-only',
}

function hasSavedCustomPreference(options) {
  const preference = options?.preference
  return Boolean(
    preference &&
      (preference.selectionMode !== 'official' || preference.preferredQuestionSetId),
  )
}

export default function ContentSelector({
  gameType,
  enabled,
  selectionMode,
  setSelectionMode,
  preferredQuestionSetId,
  setPreferredQuestionSetId,
  compact = false,
}) {
  const isQuizcraft = gameType === 'quizcraft'
  const { getToken } = useAuth()
  const [options, setOptions] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      if (!enabled || !gameType) {
        setOptions(null)
        setError('')
        setSelectionMode('official')
        setPreferredQuestionSetId(null)
        return
      }
      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        const result = await contentRequest(contentOptionsPath(gameType), { token })
        if (cancelled) return
        setOptions(result.options)
        const savedMode = isQuizcraft
          ? 'user_only'
          : result.options?.preference?.selectionMode || 'official'
        const safeMode = result.options?.modes?.[savedMode]?.enabled ? savedMode : 'official'
        const playablePacks = (result.options?.packs || []).filter(
          (pack) => pack.status === 'active' && pack.counts?.active > 0,
        )
        const savedPackId = result.options?.preference?.preferredQuestionSetId
        const selectedPackId = isQuizcraft
          ? playablePacks.some((pack) => pack.id === savedPackId)
            ? savedPackId
            : playablePacks[0]?.id || null
          : savedPackId || null
        setSelectionMode(safeMode)
        setPreferredQuestionSetId(
          safeMode === 'official'
            ? null
            : selectedPackId,
        )
      } catch {
        if (cancelled) return
        setOptions(null)
        setSelectionMode('official')
        setPreferredQuestionSetId(null)
        setError('Custom packs are unavailable right now.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [enabled, gameType, getToken, isQuizcraft, setPreferredQuestionSetId, setSelectionMode])

  useEffect(() => {
    let cancelled = false

    async function savePreference() {
      if (!enabled || !options || options.customContentUnavailable || !gameType) return
      if (isQuizcraft && !preferredQuestionSetId) return
      if (!options.modes?.[selectionMode]?.enabled) {
        setError('')
        return
      }
      if (
        selectionMode === 'official' &&
        !preferredQuestionSetId &&
        !hasSavedCustomPreference(options)
      ) {
        setError('')
        return
      }
      try {
        const token = await getToken()
        if (!token) {
          if (!cancelled) {
            setError(
              selectionMode === 'official' ? '' : 'Sign in to manage custom packs.',
            )
          }
          return
        }
        await contentRequest(`/api/me/content-preferences/${gameType}`, {
          token,
          method: 'PUT',
          body: { selectionMode, preferredQuestionSetId },
        })
        if (!cancelled) setError('')
      } catch (saveError) {
        if (!cancelled) setError(saveError?.message || 'Could not save content preference.')
      }
    }

    savePreference()
    return () => {
      cancelled = true
    }
  }, [enabled, gameType, getToken, isQuizcraft, options, preferredQuestionSetId, selectionMode])

  if (!enabled) return null

  const packs = options?.packs || []
  const activePacks = packs.filter((pack) => pack.status === 'active' && pack.counts?.active > 0)

  if (isQuizcraft) {
    return (
      <section className={`content-selector quizcraft-selector ${compact ? 'compact' : ''}`}>
        <div className="content-selector-heading">
          <div>
            <strong>Choose your quiz</strong>
            <span>Quizcraft only plays questions from the quiz you select.</span>
          </div>
          <Link className="quizcraft-manage-link" to="/packs">Manage quizzes</Link>
        </div>
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <div className="content-loading">
            <Spinner className="spinner content-spinner" label="Loading quizzes" />
            <span>Loading quizzes</span>
          </div>
        ) : activePacks.length ? (
          <label className="content-pack-select">
            <span>Quiz</span>
            <select
              value={preferredQuestionSetId || ''}
              onChange={(event) => {
                setSelectionMode('user_only')
                setPreferredQuestionSetId(event.target.value || null)
              }}
            >
              <option value="">Choose a quiz</option>
              {activePacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.title} ({pack.counts.active} {pack.counts.active === 1 ? 'question' : 'questions'})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="quizcraft-empty-state">
            <strong>No published quizzes yet</strong>
            <span>Create a Quizcraft pack, add at least one active question, then publish it.</span>
            <Link className="primary quizcraft-create-link" to="/packs">Create a quiz</Link>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className={`content-selector ${compact ? 'compact' : ''}`}>
      <div className="content-selector-heading">
        <div>
          <strong>Content</strong>
          <span>Choose the questions for this game.</span>
        </div>
        <Link to="/packs">Manage packs</Link>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="content-options-area">
        {loading && (
          <div className="content-loading">
            <Spinner className="spinner content-spinner" label="Loading custom packs" />
            <span>Loading packs</span>
          </div>
        )}
      <div className="content-mode-grid">
        {Object.entries(modeLabels).map(([mode, label]) => {
          const modeOption = options?.modes?.[mode]
          const disabled = !options || !modeOption?.enabled
          return (
            <button
              type="button"
              key={mode}
              className={selectionMode === mode ? 'active' : ''}
              disabled={disabled}
              onClick={() => setSelectionMode(mode)}
            >
              <strong>{label}</strong>
              <small>
                {modeOption?.reason ||
                  (mode === 'official'
                    ? 'Built-in packs only'
                    : mode === 'mixed'
                      ? 'Blend official and yours'
                      : 'Only your active pack')}
              </small>
            </button>
          )
        })}
      </div>
      </div>
      {selectionMode === 'user_only' && (
        <label className="content-pack-select">
          <span>Custom pack</span>
          <select
            value={preferredQuestionSetId || ''}
            onChange={(event) => setPreferredQuestionSetId(event.target.value || null)}
          >
            <option value="">All active custom questions</option>
            {activePacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.title} ({pack.counts.active} active)
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  )
}
