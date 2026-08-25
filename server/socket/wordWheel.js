import crypto from 'node:crypto'
import {
  approveDictionaryWord,
  dictionaryStatusForWord,
  firstLetterForWord,
} from '../game/wordDictionary.js'
import { getRoom, getSocketPlayer, replyError } from './utils.js'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function activeWordWheelPlayers(room) {
  return room.players.filter((player) => player.active)
}

function playerName(room, playerId) {
  return room.players.find((player) => player.id === playerId)?.name || null
}

function lastLiveSubmission(room) {
  return [...(room.wordWheelSubmissions || [])].reverse().find((submission) => !submission.revoked)
}

function previousLiveSubmission(room) {
  const live = (room.wordWheelSubmissions || []).filter((submission) => !submission.revoked)
  return live[live.length - 1] || null
}

function nextActivePlayerId(room, currentPlayerId) {
  const activeIds = new Set(activeWordWheelPlayers(room).map((player) => player.id))
  if (!activeIds.size) return null
  const currentIndex = Math.max(
    0,
    room.players.findIndex((player) => player.id === currentPlayerId),
  )
  for (let offset = 1; offset <= room.players.length; offset += 1) {
    const player = room.players[(currentIndex + offset) % room.players.length]
    if (player && activeIds.has(player.id)) return player.id
  }
  return null
}

function finishWordWheelRound(room, clearQuestionTimer, winnerId, reason) {
  clearQuestionTimer(room)
  room.wordWheelActivePlayerId = null
  room.wordWheelTimerRemainingMs = null
  room.wordWheelRoundWinnerId = winnerId || null
  room.wordWheelRoundWinnerName = playerName(room, winnerId)
  room.wordWheelRoundEndReason = reason
  if (winnerId) {
    const winner = room.players.find((player) => player.id === winnerId)
    if (winner) winner.score = (winner.score || 0) + 1
  }
  if (winnerId && (room.players.find((player) => player.id === winnerId)?.score || 0) >= room.settings.targetScore) {
    room.phase = 'finished'
    room.finishReason = 'completed'
    return
  }
  room.phase = 'word-wheel-round-over'
}

function startWordWheelTimer(room, clearQuestionTimer, broadcast, durationMs) {
  clearQuestionTimer(room)
  room.wordWheelTimerRemainingMs = null
  room.questionEndsAt = Date.now() + durationMs
  room.questionTimer = setTimeout(() => {
    expireWordWheelTurn(room, clearQuestionTimer, broadcast)
  }, durationMs)
}

function startWordWheelTurn(room, clearQuestionTimer, broadcast, playerId, durationMs) {
  const activePlayers = activeWordWheelPlayers(room)
  if (activePlayers.length <= 1) {
    finishWordWheelRound(room, clearQuestionTimer, activePlayers[0]?.id || null, 'last-player')
    return
  }
  const activePlayerId = activePlayers.some((player) => player.id === playerId)
    ? playerId
    : activePlayers[0]?.id
  room.wordWheelActivePlayerId = activePlayerId
  room.wordWheelTimerRemainingMs = null
  room.phase = 'word-wheel-playing'
  startWordWheelTimer(
    room,
    clearQuestionTimer,
    broadcast,
    durationMs || (room.settings.turnSeconds || 15) * 1000,
  )
}

export function startWordWheelRound(room, clearQuestionTimer, broadcast) {
  clearQuestionTimer(room)
  room.wordWheelUsedLetters = []
  room.wordWheelSubmissions = []
  room.wordWheelLastSubmissionId = null
  room.wordWheelRoundWinnerId = null
  room.wordWheelRoundWinnerName = null
  room.wordWheelRoundEndReason = null
  room.wordWheelTimerRemainingMs = null
  room.players.forEach((player) => {
    player.active = true
    player.hasAnswered = false
    player.answer = null
    player.roundPoints = 0
  })
  const startIndex = Math.max(0, room.questionIndex) % room.players.length
  startWordWheelTurn(room, clearQuestionTimer, broadcast, room.players[startIndex]?.id)
}

function expireWordWheelTurn(room, clearQuestionTimer, broadcast) {
  if (room.gameType !== 'word-wheel' || room.phase !== 'word-wheel-playing') return
  const player = room.players.find((item) => item.id === room.wordWheelActivePlayerId)
  if (!player) return
  player.active = false
  player.hasAnswered = false
  player.answer = null
  room.wordWheelLastMove = {
    type: 'timeout',
    playerId: player.id,
    playerName: player.name,
    createdAt: Date.now(),
  }
  const remaining = activeWordWheelPlayers(room)
  if (remaining.length <= 1) {
    finishWordWheelRound(room, clearQuestionTimer, remaining[0]?.id || null, 'timeout')
  } else {
    startWordWheelTurn(room, clearQuestionTimer, broadcast, nextActivePlayerId(room, player.id))
  }
  broadcast(room)
}

function undoLastSubmission(room) {
  const lastSubmission = lastLiveSubmission(room)
  if (!lastSubmission) return null
  lastSubmission.revoked = true
  room.wordWheelUsedLetters = (room.wordWheelUsedLetters || []).filter(
    (letter) => letter !== lastSubmission.letter,
  )
  const previous = previousLiveSubmission(room)
  room.wordWheelLastSubmissionId = previous?.id || null
  room.wordWheelLastMove = {
    type: 'undo',
    playerId: lastSubmission.playerId,
    playerName: lastSubmission.playerName,
    letter: lastSubmission.letter,
    createdAt: Date.now(),
  }
  return lastSubmission
}

function ensureWordWheelHost(room, socket, callback) {
  if (!room || room.hostSocketId !== socket.id) {
    replyError(callback, 'Only the host can control Word Wheel.')
    return false
  }
  if (room.gameType !== 'word-wheel') {
    replyError(callback, 'Word Wheel is not active.')
    return false
  }
  return true
}

function ensureWordWheelInProgress(room, callback) {
  if (!['word-wheel-playing', 'word-wheel-paused', 'word-wheel-round-over'].includes(room.phase)) {
    replyError(callback, 'Word Wheel is not in progress.')
    return false
  }
  return true
}

export function registerWordWheelHandlers({ socket, rooms, broadcast, clearQuestionTimer }) {
  socket.on('player:word-wheel-submit', async ({ code, letter, word } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
    const cleanLetter = String(letter || '').trim().toUpperCase()
    const cleanWord = String(word || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'word-wheel' || room.phase !== 'word-wheel-playing') {
      return replyError(callback, 'Word Wheel is not taking answers right now.')
    }
    if (player.id !== room.wordWheelActivePlayerId) {
      return replyError(callback, 'Wait for your turn.')
    }
    if (!player.active) return replyError(callback, 'You are out for this category.')
    if (!alphabet.includes(cleanLetter)) return replyError(callback, 'Choose an available letter.')
    if ((room.wordWheelUsedLetters || []).includes(cleanLetter)) {
      return replyError(callback, `${cleanLetter} has already been used.`)
    }

    let dictionaryStatus = 'spoken'
    let normalizedWord = ''
    if (room.settings.inputMode === 'type') {
      if (!cleanWord) return replyError(callback, 'Type a word before locking a letter.')
      const firstLetter = firstLetterForWord(cleanWord)
      if (!firstLetter) return replyError(callback, 'Type a word that starts with a letter.')
      if (firstLetter !== cleanLetter) {
        return replyError(callback, `That word starts with ${firstLetter}, not ${cleanLetter}.`)
      }
      const result = await dictionaryStatusForWord(cleanWord)
      if (result.status === 'invalid') return replyError(callback, 'Type a valid word.')
      dictionaryStatus = result.status
      normalizedWord = result.normalizedWord
    }

    clearQuestionTimer(room)
    const submission = {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      letter: cleanLetter,
      word: room.settings.inputMode === 'type' ? cleanWord : null,
      normalizedWord,
      dictionaryStatus,
      inputMode: room.settings.inputMode,
      createdAt: Date.now(),
      revoked: false,
    }
    room.wordWheelUsedLetters.push(cleanLetter)
    room.wordWheelSubmissions.push(submission)
    room.wordWheelLastSubmissionId = submission.id
    room.wordWheelLastMove = {
      type: 'claim',
      playerId: player.id,
      playerName: player.name,
      letter: cleanLetter,
      word: submission.word,
      dictionaryStatus,
      createdAt: submission.createdAt,
    }
    player.answer = room.settings.inputMode === 'type' ? cleanWord : cleanLetter
    player.hasAnswered = true

    if (room.wordWheelUsedLetters.length >= alphabet.length) {
      finishWordWheelRound(room, clearQuestionTimer, player.id, 'letters-complete')
    } else {
      startWordWheelTurn(room, clearQuestionTimer, broadcast, nextActivePlayerId(room, player.id))
    }
    callback?.({ ok: true, dictionaryStatus })
    broadcast(room)
  })

  socket.on('host:word-wheel-pause', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (room.phase !== 'word-wheel-playing') return replyError(callback, 'The timer is not running.')
    room.wordWheelTimerRemainingMs = Math.max(0, room.questionEndsAt - Date.now())
    clearQuestionTimer(room)
    room.phase = 'word-wheel-paused'
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:word-wheel-resume', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (room.phase !== 'word-wheel-paused') return replyError(callback, 'The timer is not paused.')
    const remainingMs = room.wordWheelTimerRemainingMs || (room.settings.turnSeconds || 15) * 1000
    room.phase = 'word-wheel-playing'
    startWordWheelTimer(room, clearQuestionTimer, broadcast, remainingMs)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:word-wheel-accept-word', async ({ code, submissionId } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (!ensureWordWheelInProgress(room, callback)) return
    const submission =
      (room.wordWheelSubmissions || []).find((item) => item.id === submissionId) ||
      lastLiveSubmission(room)
    if (!submission || submission.revoked || !submission.word) {
      return replyError(callback, 'There is no typed word to accept.')
    }
    await approveDictionaryWord({
      word: submission.word,
      normalizedWord: submission.normalizedWord,
      acceptedByUserId: room.hostUserId,
      acceptedByClerkUserId: room.hostClerkUserId,
      gameType: room.gameType,
    })
    submission.dictionaryStatus = 'host-approved'
    room.wordWheelLastMove = {
      type: 'host-approved',
      playerId: submission.playerId,
      playerName: submission.playerName,
      letter: submission.letter,
      word: submission.word,
      createdAt: Date.now(),
    }
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:word-wheel-undo-last', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (!ensureWordWheelInProgress(room, callback)) return
    const undone = undoLastSubmission(room)
    if (!undone) return replyError(callback, 'There is no letter to undo.')
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:word-wheel-return-turn', ({ code, playerId } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (!ensureWordWheelInProgress(room, callback)) return
    const lastSubmission = lastLiveSubmission(room)
    const targetId = playerId || lastSubmission?.playerId
    const target = room.players.find((player) => player.id === targetId)
    if (!target) return replyError(callback, 'Choose a player in this round.')
    if (lastSubmission?.playerId === target.id) undoLastSubmission(room)
    target.active = true
    target.hasAnswered = false
    target.answer = null
    startWordWheelTurn(room, clearQuestionTimer, broadcast, target.id)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:word-wheel-eliminate', ({ code, playerId } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (!ensureWordWheelInProgress(room, callback)) return
    const lastSubmission = lastLiveSubmission(room)
    const targetId = playerId || room.wordWheelActivePlayerId || lastSubmission?.playerId
    const target = room.players.find((player) => player.id === targetId)
    if (!target) return replyError(callback, 'Choose a player to eliminate.')
    if (lastSubmission?.playerId === target.id) undoLastSubmission(room)
    target.active = false
    target.hasAnswered = false
    target.answer = null
    room.wordWheelLastMove = {
      type: 'host-eliminated',
      playerId: target.id,
      playerName: target.name,
      createdAt: Date.now(),
    }
    const remaining = activeWordWheelPlayers(room)
    if (remaining.length <= 1) {
      finishWordWheelRound(room, clearQuestionTimer, remaining[0]?.id || null, 'host-eliminated')
    } else {
      startWordWheelTurn(room, clearQuestionTimer, broadcast, nextActivePlayerId(room, target.id))
    }
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:word-wheel-next', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!ensureWordWheelHost(room, socket, callback)) return
    if (room.phase !== 'word-wheel-round-over') {
      return replyError(callback, 'Finish the category before starting the next one.')
    }
    if (room.questionIndex >= room.questions.length - 1) {
      room.phase = 'finished'
      room.finishReason = 'completed'
      callback?.({ ok: true })
      broadcast(room)
      return
    }
    room.questionIndex += 1
    startWordWheelRound(room, clearQuestionTimer, broadcast)
    callback?.({ ok: true })
    broadcast(room)
  })
}
