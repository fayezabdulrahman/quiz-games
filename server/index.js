import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { selectQuestions } from './questions.js'

const app = express()
const server = createServer(app)
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins : true
const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: true },
})

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

const rooms = new Map()
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const questionDurationMs = Number(process.env.QUESTION_TIME_MS || 30_000)

function makeCode() {
  let code = ''
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  } while (rooms.has(code))
  return code
}

function normalize(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[.,!?'"-]/g, '')
    .replace(/\s+/g, ' ')
}

function correctAnswer(question, submitted) {
  const answers = question.acceptedOverride || (Array.isArray(question.answer) ? question.answer : [question.answer])
  return answers.some((answer) => normalize(answer) === normalize(submitted))
}

function normalizeLifelineCount(value) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.min(Math.max(count, 0), 10) : 1
}

function playerView(player, revealResponses = false) {
  return {
    id: player.id,
    name: player.name,
    active: player.active,
    connected: player.connected,
    hasAnswered: player.hasAnswered,
    isCorrect: player.isCorrect,
    passedCurrentQuestion: player.passedCurrentQuestion,
    lifelinesRemaining: player.lifelinesRemaining,
    ...(revealResponses
      ? {
          submittedAnswer: player.passedCurrentQuestion ? 'PASS' : player.answer,
        }
      : {}),
  }
}

function publicState(room, socketId) {
  const question = room.questions[room.questionIndex]
  const me = room.players.find((player) => player.socketId === socketId)
  const revealResponses =
    room.phase === 'revealed' || (room.phase === 'finished' && room.finishReason === 'all-eliminated')
  return {
    code: room.code,
    phase: room.phase,
    questionIndex: room.questionIndex,
    totalQuestions: room.questions.length,
    difficulty: question?.difficulty ?? null,
    questionEndsAt: room.questionEndsAt,
    questionTimeRemainingMs: room.questionEndsAt
      ? Math.max(0, room.questionEndsAt - Date.now())
      : 0,
    questionDurationMs,
    question: question
      ? {
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          detail: question.detail,
          options: question.options,
          ...(room.phase === 'revealed' ||
          (room.phase === 'finished' && room.finishReason === 'all-eliminated')
            ? {
                answer: Array.isArray(question.answer) ? question.answer[0] : question.answer,
                explanation: question.explanation,
              }
            : {}),
        }
      : null,
    players: room.players.map((player) => playerView(player, revealResponses)),
    me: me ? playerView(me, revealResponses) : null,
    isHost: room.hostSocketId === socketId,
    settings: room.settings,
    finishReason: room.finishReason,
    winnerNames: room.phase === 'finished' ? room.players.filter((player) => player.active).map((player) => player.name) : [],
  }
}

function broadcast(room) {
  for (const socketId of room.socketIds) {
    io.to(socketId).emit('room:state', publicState(room, socketId))
  }
}

function getRoom(code) {
  return rooms.get(String(code || '').trim().toUpperCase())
}

function replyError(callback, message) {
  callback?.({ ok: false, error: message })
}

function clearQuestionTimer(room) {
  if (room.questionTimer) clearTimeout(room.questionTimer)
  room.questionTimer = null
  room.questionEndsAt = null
}

function revealQuestion(room) {
  if (room.phase !== 'answering') return false
  clearQuestionTimer(room)
  const question = room.questions[room.questionIndex]
  room.players.forEach((player) => {
    if (!player.active) return
    player.isCorrect =
      player.passedCurrentQuestion || (player.hasAnswered && correctAnswer(question, player.answer))
    if (!player.isCorrect) player.active = false
  })
  if (!room.players.some((player) => player.active)) {
    room.phase = 'finished'
    room.finishReason = 'all-eliminated'
  } else {
    room.phase = 'revealed'
  }
  return true
}

function startQuestionTimer(room) {
  clearQuestionTimer(room)
  const questionIndex = room.questionIndex
  room.questionEndsAt = Date.now() + questionDurationMs
  room.questionTimer = setTimeout(() => {
    if (room.phase !== 'answering' || room.questionIndex !== questionIndex) return
    revealQuestion(room)
    broadcast(room)
  }, questionDurationMs)
}

function closeExpiredQuestion(room) {
  if (room.phase === 'answering' && room.questionEndsAt && Date.now() >= room.questionEndsAt) {
    revealQuestion(room)
    broadcast(room)
    return true
  }
  return false
}

io.on('connection', (socket) => {
  socket.on('host:create', ({ hostName, lifelineCount, lifelinesAnytime } = {}, callback) => {
    const code = makeCode()
    const usedQuestionIds = new Set()
    const room = {
      code,
      hostName: String(hostName || 'Quizmaster').trim().slice(0, 24),
      hostSocketId: socket.id,
      socketIds: new Set([socket.id]),
      players: [],
      phase: 'lobby',
      finishReason: null,
      questionIndex: -1,
      questionEndsAt: null,
      questionTimer: null,
      questions: selectQuestions(usedQuestionIds),
      usedQuestionIds,
      settings: {
        lifelineCount: normalizeLifelineCount(lifelineCount),
        lifelinesAnytime: Boolean(lifelinesAnytime),
      },
    }
    rooms.set(code, room)
    socket.join(code)
    callback?.({ ok: true, code })
    broadcast(room)
  })

  socket.on('player:join', ({ code, name } = {}, callback) => {
    const room = getRoom(code)
    const cleanName = String(name || '').trim().slice(0, 20)
    if (!room) return replyError(callback, 'That room code does not exist.')
    if (room.phase !== 'lobby') return replyError(callback, 'This game has already started.')
    if (!cleanName) return replyError(callback, 'Enter a player name.')
    if (room.players.some((player) => player.name.toLowerCase() === cleanName.toLowerCase())) {
      return replyError(callback, 'That name is already in use.')
    }

    const player = {
      id: crypto.randomUUID(),
      socketId: socket.id,
      name: cleanName,
      active: true,
      connected: true,
      hasAnswered: false,
      answer: null,
      isCorrect: null,
      passedCurrentQuestion: false,
      lifelinesRemaining: room.settings.lifelineCount,
    }
    room.players.push(player)
    room.socketIds.add(socket.id)
    socket.join(room.code)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:start', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can start.')
    if (!room.players.length) return replyError(callback, 'At least one player must join.')
    room.questionIndex = 0
    room.phase = 'answering'
    room.finishReason = null
    room.players.forEach((player) => {
      player.active = true
      player.hasAnswered = false
      player.answer = null
      player.isCorrect = null
      player.passedCurrentQuestion = false
      player.lifelinesRemaining = room.settings.lifelineCount
    })
    startQuestionTimer(room)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('player:answer', ({ code, answer } = {}, callback) => {
    const room = getRoom(code)
    const player = room?.players.find((item) => item.socketId === socket.id)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
    if (room.phase !== 'answering') return replyError(callback, 'Answers are closed.')
    if (!player.active) return replyError(callback, 'You are spectating this round.')
    if (player.hasAnswered) return replyError(callback, 'Your answer is already locked.')
    if (!String(answer || '').trim()) return replyError(callback, 'Choose or enter an answer.')

    player.answer = String(answer).trim().slice(0, 120)
    player.hasAnswered = true
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('player:pass', ({ code } = {}, callback) => {
    const room = getRoom(code)
    const player = room?.players.find((item) => item.socketId === socket.id)
    const question = room?.questions[room.questionIndex]
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
    if (room.phase !== 'answering') return replyError(callback, 'Answers are closed.')
    if (!player.active) return replyError(callback, 'You are spectating this round.')
    if (player.hasAnswered) return replyError(callback, 'Your response is already locked.')
    if (player.lifelinesRemaining < 1) return replyError(callback, 'You have no passes remaining.')
    if (!room.settings.lifelinesAnytime && question?.difficulty > 50) {
      return replyError(callback, 'Passes unlock from the 50% question.')
    }

    player.hasAnswered = true
    player.answer = null
    player.passedCurrentQuestion = true
    player.lifelinesRemaining -= 1
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:reveal', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can reveal.')
    if (room.phase !== 'answering') return replyError(callback, 'There is nothing to reveal.')
    revealQuestion(room)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:next', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can continue.')
    if (room.phase !== 'revealed') return replyError(callback, 'Reveal the answer first.')
    if (room.questionIndex >= room.questions.length - 1) {
      room.phase = 'finished'
      room.finishReason = 'completed'
    } else {
      room.questionIndex += 1
      room.phase = 'answering'
      room.players.forEach((player) => {
        player.hasAnswered = false
        player.answer = null
        player.isCorrect = null
        player.passedCurrentQuestion = false
      })
      startQuestionTimer(room)
    }
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:end', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can end the game.')
    if (room.phase !== 'revealed') return replyError(callback, 'End the game after revealing the answer.')
    clearQuestionTimer(room)
    room.phase = 'finished'
    room.finishReason = 'host-ended'
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:restart', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can restart.')
    room.questions = selectQuestions(room.usedQuestionIds)
    clearQuestionTimer(room)
    room.questionIndex = -1
    room.phase = 'lobby'
    room.finishReason = null
    room.players.forEach((player) => {
      player.active = true
      player.hasAnswered = false
      player.answer = null
      player.isCorrect = null
      player.passedCurrentQuestion = false
      player.lifelinesRemaining = room.settings.lifelineCount
    })
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      if (room.hostSocketId === socket.id) {
        clearQuestionTimer(room)
        io.to(code).emit('room:closed')
        rooms.delete(code)
        continue
      }
      const player = room.players.find((item) => item.socketId === socket.id)
      if (player) {
        player.connected = false
        room.socketIds.delete(socket.id)
        broadcast(room)
      }
    }
  })
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, rooms: rooms.size })
})

if (process.env.NODE_ENV === 'production') {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(dirname, '../dist')
  app.use(express.static(dist))
  app.get('/{*splat}', (_request, response) => response.sendFile(path.join(dist, 'index.html')))
}

const port = Number(process.env.PORT || 3001)
server.listen(port, '0.0.0.0', () => {
  console.log(`Quiz server listening on http://localhost:${port}`)
})
