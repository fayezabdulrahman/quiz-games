import { SignInButton, useAuth } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import { games } from '../../data/games.js'
import { contentFormRequest, contentRequest, questionPacksPath } from '../../lib/contentApi.js'
import { validateCustomQuestion } from '../../../shared/customQuestionSchemas.js'
import ComposingPackDetail from './packs/ComposingPackDetail.jsx'
import DeleteConfirmationModal from './packs/DeleteConfirmationModal.jsx'
import PackGameGrid from './packs/PackGameGrid.jsx'
import PacksSidebar from './packs/PacksSidebar.jsx'
import SavedPackDetail from './packs/SavedPackDetail.jsx'
import { questionTitle } from './packs/packData.js'

export default function PacksPage({ accountAccess }) {
  const { getToken, isSignedIn } = useAuth()
  const [gameType, setGameType] = useState('')
  const [packs, setPacks] = useState([])
  const [selectedPackId, setSelectedPackId] = useState(null)
  const [selectedPack, setSelectedPack] = useState(null)
  const [editorQuestion, setEditorQuestion] = useState(null)
  const [editing, setEditing] = useState(false)
  const [composingPack, setComposingPack] = useState(false)
  const [draftPackTitle, setDraftPackTitle] = useState('')
  const [pendingPackQuestions, setPendingPackQuestions] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [packsLoading, setPacksLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const editorScrollRef = useRef(null)
  const shouldScrollToEditorRef = useRef(false)
  const selectedGame = games.find((game) => game.id === gameType)

  const canManage = Boolean(
    isSignedIn && accountAccess?.access?.featureKeys?.includes('custom_questions'),
  )

  const tokenRequest = async (path, options) => {
    const token = await getToken()
    return contentRequest(path, { ...options, token })
  }

  const uploadQuestionImage = async (file) => {
    const token = await getToken()
    const body = new FormData()
    body.append('image', file)
    const result = await contentFormRequest('/api/me/question-assets', { token, body })
    return result.media
  }

  const deleteQuestionImage = async (storageKey) => {
    if (!storageKey) return
    await tokenRequest('/api/me/question-assets', {
      method: 'DELETE',
      body: { storageKey },
    })
  }

  const generateQuestion = async ({ gameType: targetGameType, topic }) =>
    tokenRequest('/api/me/question-generation', {
      method: 'POST',
      body: { gameType: targetGameType, topic },
    })

  const mediaStorageKeys = (media = []) =>
    Array.from(
      new Set(
        (Array.isArray(media) ? media : [])
          .map((item) => item?.storageKey)
          .filter(Boolean),
      ),
    )

  const deleteQuestionMedia = async (questions = []) => {
    const storageKeys = questions.flatMap((question) =>
      mediaStorageKeys(question?.form?.media || question?.payload?.media),
    )
    await Promise.all(storageKeys.map(deleteQuestionImage))
  }

  const loadPacks = async () => {
    if (!canManage || !gameType) return
    setBusy(true)
    setError('')
    try {
      const result = await tokenRequest(questionPacksPath(gameType))
      setPacks(result.packs || [])
      setSelectedPackId((current) => current || result.packs?.[0]?.id || null)
    } catch (loadError) {
      setError(loadError?.message || 'Could not load packs.')
    } finally {
      setBusy(false)
    }
  }

  const loadPack = async (packId) => {
    if (!packId) {
      setSelectedPack(null)
      return
    }
    try {
      const result = await tokenRequest(`/api/me/question-packs/${packId}`)
      setSelectedPack(result.pack)
    } catch (loadError) {
      setError(loadError?.message || 'Could not load that pack.')
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadGamePacks() {
      if (!canManage || !gameType) return
      setPacksLoading(true)
      try {
        const token = await getToken()
        const result = await contentRequest(questionPacksPath(gameType), { token })
        if (cancelled) return
        setPacks(result.packs || [])
        setSelectedPack(null)
        setEditing(false)
        setComposingPack(false)
        setDraftPackTitle('')
        setPendingPackQuestions([])
        setEditorQuestion(null)
        setDeleteConfirmation(null)
        setSelectedPackId(result.packs?.[0]?.id || null)
        setError('')
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'Could not load packs.')
      } finally {
        if (!cancelled) setPacksLoading(false)
      }
    }

    loadGamePacks()
    return () => {
      cancelled = true
    }
  }, [gameType, canManage, getToken])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedPack() {
      if (!selectedPackId) return
      try {
        const token = await getToken()
        const result = await contentRequest(`/api/me/question-packs/${selectedPackId}`, { token })
        if (!cancelled) setSelectedPack(result.pack)
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'Could not load that pack.')
      }
    }

    loadSelectedPack()
    return () => {
      cancelled = true
    }
  }, [selectedPackId, getToken])

  useEffect(() => {
    if (!editing || !shouldScrollToEditorRef.current) return
    shouldScrollToEditorRef.current = false
    window.requestAnimationFrame(() => {
      editorScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [editing, editorQuestion])

  const resetPackWorkspace = () => {
    setSelectedPack(null)
    setEditing(false)
    setComposingPack(false)
    setDraftPackTitle('')
    setPendingPackQuestions([])
    setEditorQuestion(null)
    setDeleteConfirmation(null)
  }

  const selectGame = (nextGameType) => {
    setGameType(nextGameType)
    setPacks([])
    setSelectedPackId(null)
    resetPackWorkspace()
  }

  const stopEditing = () => {
    setEditing(false)
    setEditorQuestion(null)
  }

  const startQuestion = () => {
    shouldScrollToEditorRef.current = true
    setEditorQuestion(null)
    setEditing(true)
  }

  const startNewPack = () => {
    if (!gameType) return
    setSelectedPackId(null)
    setSelectedPack(null)
    setEditorQuestion(null)
    shouldScrollToEditorRef.current = true
    setEditing(true)
    setComposingPack(true)
    setDraftPackTitle('')
    setPendingPackQuestions([])
    setError('')
  }

  const closeComposingPack = async (deleteImages = true) => {
    if (deleteImages) await deleteQuestionMedia(pendingPackQuestions)
    setComposingPack(false)
    setDraftPackTitle('')
    setPendingPackQuestions([])
    setEditorQuestion(null)
    setEditing(false)
  }

  const savePack = async () => {
    const title = draftPackTitle.trim()
    if (!title) {
      setError('Name the pack before saving it.')
      return null
    }
    setBusy(true)
    setError('')
    try {
      const result = await tokenRequest('/api/me/question-packs', {
        method: 'POST',
        body: {
          gameType,
          title,
          status: 'draft',
        },
      })
      for (const question of pendingPackQuestions) {
        await tokenRequest(`/api/me/question-packs/${result.pack.id}/questions`, {
          method: 'POST',
          body: {
            form: question.form,
            status: question.status,
          },
        })
      }
      await loadPacks()
      await closeComposingPack(false)
      setSelectedPackId(result.pack.id)
      await loadPack(result.pack.id)
      return result.pack
    } catch (saveError) {
      setError(saveError?.message || 'Could not save the pack.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const saveQuestion = async (payload) => {
    if (composingPack) {
      savePendingQuestion(payload)
      return
    }
    const targetPack = selectedPack
    if (!targetPack) return
    setBusy(true)
    setError('')
    try {
      const path = editorQuestion
        ? `/api/me/question-packs/${targetPack.id}/questions/${editorQuestion.id}`
        : `/api/me/question-packs/${targetPack.id}/questions`
      await tokenRequest(path, {
        method: editorQuestion ? 'PATCH' : 'POST',
        body: payload,
      })
      setComposingPack(false)
      stopEditing()
      await loadPack(targetPack.id)
      await loadPacks()
    } catch (saveError) {
      setError(saveError?.message || 'Could not save the question.')
    } finally {
      setBusy(false)
    }
  }

  const savePendingQuestion = (payload) => {
    const validation = validateCustomQuestion(gameType, payload.form)
    const previousKeys = mediaStorageKeys(editorQuestion?.form?.media || editorQuestion?.payload?.media)
    const nextKeys = new Set(mediaStorageKeys(payload.form?.media))
    const removedKeys = previousKeys.filter((storageKey) => !nextKeys.has(storageKey))
    Promise.all(removedKeys.map(deleteQuestionImage)).catch((deleteError) => {
      setError(deleteError?.message || 'Could not delete a removed image.')
    })
    const pendingQuestion = {
      id: editorQuestion?.id || `local-${crypto.randomUUID()}`,
      localId: editorQuestion?.localId || editorQuestion?.id || `local-${crypto.randomUUID()}`,
      gameType,
      status: payload.status,
      questionKind: validation.row?.questionKind,
      prompt: validation.row?.prompt,
      answer: validation.row?.answer,
      payload: {
        ...validation.row?.payload,
        completion: {
          isComplete: validation.isComplete,
          errors: validation.errors,
        },
      },
      form: payload.form,
    }
    setPendingPackQuestions((current) => {
      if (!editorQuestion?.localId && !editorQuestion?.id) return [...current, pendingQuestion]
      return current.map((question) =>
        question.localId === (editorQuestion.localId || editorQuestion.id) ? pendingQuestion : question
      )
    })
    stopEditing()
  }

  const editQuestion = (question) => {
    shouldScrollToEditorRef.current = true
    setEditorQuestion(question)
    setEditing(true)
  }

  const requestDeletePendingQuestion = (question) => {
    setDeleteConfirmation({
      type: 'pending-question',
      question,
      title: 'Delete this question?',
      description: 'This removes the question from the pack you are building.',
      detail: questionTitle(question),
      confirmLabel: 'Delete question',
    })
  }

  const requestDeleteQuestion = (question) => {
    setDeleteConfirmation({
      type: 'question',
      question,
      pack: selectedPack,
      title: 'Delete this question?',
      description: 'This permanently removes the saved question from this pack.',
      detail: questionTitle(question),
      confirmLabel: 'Delete question',
    })
  }

  const requestDeletePack = () => {
    if (!selectedPack) return
    setDeleteConfirmation({
      type: 'pack',
      pack: selectedPack,
      title: 'Delete this pack?',
      description: 'This permanently removes the pack and all of its questions.',
      detail: selectedPack.title,
      confirmLabel: 'Delete pack',
    })
  }

  const deletePendingQuestion = async (question) => {
    await deleteQuestionMedia([question])
    setPendingPackQuestions((current) => current.filter((item) => item.localId !== question.localId))
    if ((editorQuestion?.localId || editorQuestion?.id) === (question.localId || question.id)) stopEditing()
    return true
  }

  const deleteQuestion = async (pack, question) => {
    if (!pack || !question) return false
    setBusy(true)
    setError('')
    try {
      await tokenRequest(`/api/me/question-packs/${pack.id}/questions/${question.id}`, {
        method: 'DELETE',
      })
      await loadPack(pack.id)
      await loadPacks()
      return true
    } catch (deleteError) {
      setError(deleteError?.message || 'Could not delete the question.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const deletePack = async (pack) => {
    if (!pack) return false
    setBusy(true)
    setError('')
    try {
      await tokenRequest(`/api/me/question-packs/${pack.id}`, {
        method: 'DELETE',
      })
      setSelectedPack(null)
      setSelectedPackId(null)
      stopEditing()
      await loadPacks()
      return true
    } catch (deleteError) {
      setError(deleteError?.message || 'Could not delete the pack.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return
    let deleted = false
    if (deleteConfirmation.type === 'pending-question') {
      deleted = deletePendingQuestion(deleteConfirmation.question)
    } else if (deleteConfirmation.type === 'question') {
      deleted = await deleteQuestion(deleteConfirmation.pack, deleteConfirmation.question)
    } else if (deleteConfirmation.type === 'pack') {
      deleted = await deletePack(deleteConfirmation.pack)
    }
    if (deleted) setDeleteConfirmation(null)
  }

  const updatePackStatus = async (status) => {
    if (!selectedPack) return
    setBusy(true)
    setError('')
    try {
      await tokenRequest(`/api/me/question-packs/${selectedPack.id}`, {
        method: 'PATCH',
        body: { ...selectedPack, status },
      })
      await loadPacks()
      await loadPack(selectedPack.id)
    } catch (updateError) {
      setError(updateError?.message || 'Could not update the pack.')
    } finally {
      setBusy(false)
    }
  }

  if (!isSignedIn) {
    return (
      <section className="packs-page shell">
        <div className="packs-empty">
          <h1>My Packs</h1>
          <p>Sign in to create custom question packs for your game nights.</p>
          <SignInButton mode="redirect">
            <button type="button" className="primary">Login</button>
          </SignInButton>
        </div>
      </section>
    )
  }

  if (!canManage) {
    return (
      <section className="packs-page shell">
        <div className="packs-empty">
          <h1>My Packs</h1>
          <p>Custom packs unlock with Game Night Pack or Club Pass.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="packs-page shell">
      <div className="packs-heading">
        <div>
          <div className="page-kicker">My Packs</div>
          <h1>Build the questions your group will talk about later.</h1>
        </div>
      </div>

      <PackGameGrid gameType={gameType} onSelectGame={selectGame} />

      {error && <p className="form-error">{error}</p>}

      <div className="packs-layout">
        <PacksSidebar
          busy={busy}
          gameType={gameType}
          packs={packs}
          packsLoading={packsLoading}
          selectedGame={selectedGame}
          selectedPackId={selectedPackId}
          onCreatePack={startNewPack}
          onSelectPack={setSelectedPackId}
        />

        {(composingPack || selectedPack) && (
          <main className="pack-detail">
            {composingPack ? (
              <ComposingPackDetail
                busy={busy}
                draftPackTitle={draftPackTitle}
                editorRef={editorScrollRef}
                editorQuestion={editorQuestion}
                editing={editing}
                gameType={gameType}
                pendingPackQuestions={pendingPackQuestions}
                selectedGame={selectedGame}
                onClose={closeComposingPack}
                onDeleteQuestion={requestDeletePendingQuestion}
                onDeleteImage={deleteQuestionImage}
                onEditQuestion={editQuestion}
                onGenerateQuestion={generateQuestion}
                onSavePack={savePack}
                onSaveQuestion={saveQuestion}
                onSetDraftPackTitle={setDraftPackTitle}
                onStartQuestion={startQuestion}
                onStopEditing={stopEditing}
                onUploadImage={uploadQuestionImage}
              />
            ) : (
              <SavedPackDetail
                busy={busy}
                editorRef={editorScrollRef}
                editorQuestion={editorQuestion}
                editing={editing}
                gameType={gameType}
                selectedPack={selectedPack}
                onDeletePack={requestDeletePack}
                onDeleteQuestion={requestDeleteQuestion}
                onDeleteImage={deleteQuestionImage}
                onEditQuestion={editQuestion}
                onGenerateQuestion={generateQuestion}
                onSaveQuestion={saveQuestion}
                onStartQuestion={startQuestion}
                onStopEditing={stopEditing}
                onUpdatePackStatus={updatePackStatus}
                onUploadImage={uploadQuestionImage}
              />
            )}
          </main>
        )}
      </div>
      <DeleteConfirmationModal
        confirmation={deleteConfirmation}
        busy={busy}
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
