import { correctAnswer } from '../game/helpers.js'
import { getRoom, getSocketPlayer, replyError } from './utils.js'

export function clearCatchphraseGuessTimer(room) {
  if (room.catchphraseGuessTimer) clearTimeout(room.catchphraseGuessTimer)
  room.catchphraseGuessTimer = null
  room.catchphraseGuessEndsAt = null
}

export function registerCatchphraseHandlers({
  socket,
  rooms,
  broadcast,
  closeExpiredQuestion,
  pauseQuestionTimer,
  questionDurationMs,
  resumeQuestionTimer,
  revealQuestion,
}) {
  function expireCatchphraseGuess(room, playerId) {
    if (
      room.gameType !== 'say-what-you-see' ||
      room.phase !== 'catchphrase-guessing' ||
      room.catchphraseBuzzerPlayerId !== playerId
    ) {
      return
    }

    const player = room.players.find((item) => item.id === playerId)
    if (!player) return

    clearCatchphraseGuessTimer(room)
    player.hasAnswered = true
    player.answer = null
    player.isCorrect = false
    player.buzzedOut = true
    const guess = {
      playerId: player.id,
      playerName: player.name,
      answer: 'Timer ran out, guess void',
      isCorrect: false,
      timedOut: true,
    }
    room.catchphraseLastGuess = guess
    if (!room.catchphraseGuesses) room.catchphraseGuesses = []
    room.catchphraseGuesses.push(guess)
    room.catchphraseBuzzerPlayerId = null

    const remainingGuessers = room.players.filter((item) => !item.buzzedOut)
    if (!remainingGuessers.length) {
      revealQuestion(room)
    } else {
      room.phase = 'answering'
      resumeQuestionTimer(room, room.catchphraseTimerRemainingMs || questionDurationMs)
    }
    broadcast(room)
  }

  function startCatchphraseGuessTimer(room, playerId) {
    clearCatchphraseGuessTimer(room)
    if (!room.settings.guessTimerEnabled) return
    const durationMs = (room.settings.guessSeconds || 10) * 1000
    room.catchphraseGuessEndsAt = Date.now() + durationMs
    room.catchphraseGuessTimer = setTimeout(
      () => expireCatchphraseGuess(room, playerId),
      durationMs,
    )
  }

  socket.on('player:catchphrase-buzz', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
    if (room.gameType !== 'say-what-you-see' || room.phase !== 'answering') {
      return replyError(callback, 'Buzzers are closed.')
    }
    if (player.buzzedOut) return replyError(callback, 'You have already guessed this one.')

    room.catchphraseBuzzerPlayerId = player.id
    room.catchphraseTimerRemainingMs = pauseQuestionTimer(room)
    room.phase = 'catchphrase-guessing'
    startCatchphraseGuessTimer(room, player.id)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('player:catchphrase-guess', ({ code, answer } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
    const question = room?.questions[room.questionIndex]
    const cleanAnswer = String(answer || '').trim().slice(0, 120)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'say-what-you-see' || room.phase !== 'catchphrase-guessing') {
      return replyError(callback, 'No answer is being taken right now.')
    }
    if (room.catchphraseBuzzerPlayerId !== player.id) {
      return replyError(callback, 'The buzzed-in player answers this one.')
    }
    if (!cleanAnswer) return replyError(callback, 'Type your answer.')

    player.answer = cleanAnswer
    player.hasAnswered = true
    const isCorrect = correctAnswer(question, cleanAnswer)
    clearCatchphraseGuessTimer(room)
    const guess = {
      playerId: player.id,
      playerName: player.name,
      answer: cleanAnswer,
      isCorrect,
    }
    room.catchphraseLastGuess = guess
    if (!room.catchphraseGuesses) room.catchphraseGuesses = []
    room.catchphraseGuesses.push(guess)
    if (isCorrect) {
      player.isCorrect = true
      revealQuestion(room)
    } else {
      player.isCorrect = false
      player.buzzedOut = true
      room.catchphraseBuzzerPlayerId = null
      const remainingGuessers = room.players.filter((item) => !item.buzzedOut)
      if (!remainingGuessers.length) {
        revealQuestion(room)
      } else {
        room.phase = 'answering'
        resumeQuestionTimer(room, room.catchphraseTimerRemainingMs || questionDurationMs)
      }
    }
    callback?.({ ok: true, correct: isCorrect })
    broadcast(room)
  })
}
