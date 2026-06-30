import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket.js'

const emit = (event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, (result) => resolve(result)))

const sessionStorageKey = 'game-night-room-session'

function createSessionToken() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readSavedSession() {
  try {
    return JSON.parse(sessionStorage.getItem(sessionStorageKey) || 'null')
  } catch {
    return null
  }
}

function saveSession(code, sessionToken) {
  if (!code || !sessionToken) return
  sessionStorage.setItem(sessionStorageKey, JSON.stringify({ code, sessionToken }))
}

function clearSavedSession() {
  sessionStorage.removeItem(sessionStorageKey)
}

export function useGameSession({ getAuthToken } = {}) {
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const closingRoomRef = useRef(false)

  useEffect(() => {
    const onState = (nextState) => {
      setState(nextState)
      setError('')
    }
    const onClosed = () => {
      clearSavedSession()
      setState(null)
      setError(closingRoomRef.current ? '' : 'The host closed the room.')
      closingRoomRef.current = false
    }
    const restoreSession = async () => {
      const savedSession = readSavedSession()
      if (!savedSession?.code || !savedSession?.sessionToken) return

      const result = await emit('room:restore', savedSession)
      if (!result?.ok) clearSavedSession()
    }

    socket.connect()
    socket.on('room:state', onState)
    socket.on('room:closed', onClosed)
    socket.on('connect', restoreSession)
    if (socket.connected) restoreSession()

    return () => {
      socket.off('room:state', onState)
      socket.off('room:closed', onClosed)
      socket.off('connect', restoreSession)
      socket.disconnect()
    }
  }, [])

  const action = async (event, payload = {}) => {
    setError('')
    const result = await emit(event, payload)

    if (!result?.ok) {
      setError(result?.error || 'Something went wrong.')
    }

    return result
  }

  const runBusyAction = async (event, payload) => {
    setBusy(true)
    try {
      return await action(event, payload)
    } finally {
      setBusy(false)
    }
  }

  const roomPayload = () => ({ code: state?.code })

  const hostGame = async (gameType, settings) => {
    const sessionToken = createSessionToken()
    const authToken = getAuthToken ? await getAuthToken() : null
    const result = await runBusyAction('host:create', {
      gameType,
      ...settings,
      sessionToken,
      authToken,
    })
    if (result?.ok) saveSession(result.code, result.sessionToken || sessionToken)
    return result
  }

  const joinGame = async (code, name) => {
    const sessionToken = createSessionToken()
    const result = await runBusyAction('player:join', { code, name, sessionToken })
    if (result?.ok) saveSession(code, result.sessionToken || sessionToken)
    return result
  }

  const closeRoom = async () => {
    closingRoomRef.current = true
    const result = await action('host:close-room', roomPayload())
    if (!result?.ok) closingRoomRef.current = false
    return result
  }

  return {
    state,
    busy,
    error,
    hostGame,
    joinGame,
    startGame: () => action('host:start', roomPayload()),
    answerQuestion: (answer) => action('player:answer', { ...roomPayload(), answer }),
    buzzCatchphrase: () => action('player:catchphrase-buzz', roomPayload()),
    guessCatchphrase: (answer) =>
      action('player:catchphrase-guess', { ...roomPayload(), answer }),
    submitBluff: (bluff) => action('player:bluff', { ...roomPayload(), bluff }),
    voteForBluff: (optionId) => action('player:vote', { ...roomPayload(), optionId }),
    submitSurveyGuess: (guess) =>
      action('player:survey-guess', { ...roomPayload(), guess }),
    chooseSurveyControl: (choice) =>
      action('player:survey-control', { ...roomPayload(), choice }),
    assignSurveyTeam: (playerId, teamId) =>
      action('host:survey-assign', { ...roomPayload(), playerId, teamId }),
    randomizeSurveyTeams: () => action('host:survey-randomize', roomPayload()),
    assignQuickfireTeam: (playerId, teamId) =>
      action('host:quickfire-assign', { ...roomPayload(), playerId, teamId }),
    randomizeQuickfireTeams: () => action('host:quickfire-randomize', roomPayload()),
    rollQuickfireDie: (value) =>
      action('player:quickfire-roll', { ...roomPayload(), value }),
    drawQuickfireCard: () => action('player:quickfire-draw', roomPayload()),
    scoreQuickfireCard: (correctTermIndexes) =>
      action('player:quickfire-score', { ...roomPayload(), correctTermIndexes }),
    nextQuickfireTurn: () => action('host:quickfire-next', roomPayload()),
    endQuickfireGame: () => action('host:quickfire-end', roomPayload()),
    useLifeline: () => action('player:pass', roomPayload()),
    useLadderLifeline: (lifeline) =>
      action('host:ladder-lifeline', { ...roomPayload(), lifeline }),
    revealAnswer: () => action('host:reveal', roomPayload()),
    nextQuestion: () => action('host:next', roomPayload()),
    endGame: () => action('host:end', roomPayload()),
    restartGame: () => action('host:restart', roomPayload()),
    returnToGames: () => action('host:return-to-games', roomPayload()),
    closeRoom,
    selectRoomGame: async (gameType, settings) =>
      action('host:select-game', {
        ...roomPayload(),
        gameType,
        ...settings,
        authToken: getAuthToken ? await getAuthToken() : null,
      }),
  }
}
