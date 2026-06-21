import { useEffect, useState } from 'react'
import { socket } from '../socket.js'

const emit = (event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, (result) => resolve(result)))

export function useGameSession() {
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onState = (nextState) => {
      setState(nextState)
      setError('')
    }
    const onClosed = () => {
      setState(null)
      setError('The host closed the room.')
    }

    socket.connect()
    socket.on('room:state', onState)
    socket.on('room:closed', onClosed)

    return () => {
      socket.off('room:state', onState)
      socket.off('room:closed', onClosed)
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

  return {
    state,
    busy,
    error,
    hostGame: (gameType, settings) =>
      runBusyAction('host:create', { gameType, ...settings }),
    joinGame: (code, name) => runBusyAction('player:join', { code, name }),
    startGame: () => action('host:start', roomPayload()),
    answerQuestion: (answer) => action('player:answer', { ...roomPayload(), answer }),
    submitBluff: (bluff) => action('player:bluff', { ...roomPayload(), bluff }),
    voteForBluff: (optionId) => action('player:vote', { ...roomPayload(), optionId }),
    submitSurveyGuess: (guess) =>
      action('player:survey-guess', { ...roomPayload(), guess }),
    chooseSurveyControl: (choice) =>
      action('player:survey-control', { ...roomPayload(), choice }),
    useLifeline: () => action('player:pass', roomPayload()),
    useLadderLifeline: (lifeline) =>
      action('host:ladder-lifeline', { ...roomPayload(), lifeline }),
    revealAnswer: () => action('host:reveal', roomPayload()),
    nextQuestion: () => action('host:next', roomPayload()),
    endGame: () => action('host:end', roomPayload()),
    restartGame: () => action('host:restart', roomPayload()),
    returnToGames: () => action('host:return-to-games', roomPayload()),
    selectRoomGame: (gameType, settings) =>
      action('host:select-game', { ...roomPayload(), gameType, ...settings }),
  }
}
