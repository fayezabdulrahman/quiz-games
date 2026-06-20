import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { selectBluffPrompts } from './bluffPrompts.js'
import { selectMajorityPrompts } from './majorityPrompts.js'
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
const gameTypes = new Set(['one-percent', 'majority-rules', 'bluff-battle'])

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
    score: player.score || 0,
    roundPoints: player.roundPoints || 0,
    bluffSubmitted: Boolean(player.bluff),
    hasVoted: Boolean(player.voteOptionId),
    fooledCount: player.fooledCount || 0,
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
  const isMajorityRules = room.gameType === 'majority-rules'
  const isBluffBattle = room.gameType === 'bluff-battle'
  const isScoreGame = isMajorityRules || isBluffBattle
  const topScore = Math.max(0, ...room.players.map((player) => player.score || 0))
  const bluffOptions =
    isBluffBattle && (room.phase === 'voting' || room.phase === 'revealed')
      ? room.bluffOptions.map((option) => ({
          id: option.id,
          text: option.text,
          ...(room.phase === 'revealed'
            ? {
                isTruth: option.isTruth,
                authorName: option.authorPlayerId
                  ? room.players.find((player) => player.id === option.authorPlayerId)?.name
                  : null,
                votes: room.players.filter((player) => player.voteOptionId === option.id).length,
              }
            : {}),
        }))
      : []
  return {
    code: room.code,
    gameType: room.gameType,
    gameName: isMajorityRules
      ? 'Majority Rules'
      : isBluffBattle
        ? 'Bluff Battle'
        : 'The 1% Club',
    phase: room.phase,
    questionIndex: room.questionIndex,
    totalQuestions: room.questions.length,
    difficulty: question?.difficulty ?? null,
    questionEndsAt: room.questionEndsAt,
    questionTimeRemainingMs: room.questionEndsAt
      ? Math.max(0, room.questionEndsAt - Date.now())
      : 0,
    questionDurationMs,
    bluffOptions,
    ownBluffOptionId:
      isBluffBattle && me
        ? room.bluffOptions.find((option) => option.authorPlayerId === me.id)?.id || null
        : null,
    selectedVoteOptionId: isBluffBattle && me ? me.voteOptionId : null,
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
          ...(isMajorityRules && room.phase === 'revealed'
            ? {
                results: room.roundResults,
                majorityAnswers: room.majorityAnswers,
              }
            : {}),
          ...(isBluffBattle && room.phase === 'revealed'
            ? {
                answer: question.answer,
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
    winnerNames:
      room.phase === 'finished'
          ? isScoreGame
          ? room.players
              .filter((player) => (player.score || 0) === topScore)
              .map((player) => player.name)
          : room.players.filter((player) => player.active).map((player) => player.name)
        : [],
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
  if (room.gameType === 'majority-rules') {
    const counts = new Map(question.options.map((option) => [option, 0]))
    room.players.forEach((player) => {
      if (player.hasAnswered && counts.has(player.answer)) {
        counts.set(player.answer, counts.get(player.answer) + 1)
      }
    })
    const largestCount = Math.max(0, ...counts.values())
    room.majorityAnswers =
      largestCount > 0
        ? [...counts.entries()]
            .filter(([, count]) => count === largestCount)
            .map(([option]) => option)
        : []
    room.roundResults = question.options.map((option) => ({
      option,
      votes: counts.get(option),
    }))
    room.players.forEach((player) => {
      player.roundPoints =
        player.hasAnswered && room.majorityAnswers.includes(player.answer) ? 1 : 0
      player.score = (player.score || 0) + player.roundPoints
    })
    room.phase = 'revealed'
    return true
  }
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

function buildBluffOptions(room) {
  const question = room.questions[room.questionIndex]
  const options = [
    {
      id: `truth-${room.questionIndex}`,
      text: question.answer,
      isTruth: true,
      authorPlayerId: null,
    },
    ...room.players
      .filter((player) => player.bluff)
      .map((player) => ({
        id: `bluff-${player.id}`,
        text: player.bluff,
        isTruth: false,
        authorPlayerId: player.id,
      })),
  ]
  room.bluffOptions = options.sort(() => Math.random() - 0.5)
}

function openBluffVoting(room) {
  if (room.phase !== 'bluffing') return false
  clearQuestionTimer(room)
  buildBluffOptions(room)
  room.phase = 'voting'
  startQuestionTimer(room, 'voting')
  return true
}

function revealBluffRound(room) {
  if (room.phase !== 'voting') return false
  clearQuestionTimer(room)
  const truth = room.bluffOptions.find((option) => option.isTruth)
  room.players.forEach((player) => {
    player.roundPoints = 0
    player.fooledCount = 0
  })
  room.players.forEach((voter) => {
    const selected = room.bluffOptions.find((option) => option.id === voter.voteOptionId)
    if (!selected) return
    if (selected.id === truth?.id) {
      voter.roundPoints += 2
      return
    }
    const author = room.players.find((player) => player.id === selected.authorPlayerId)
    if (author) {
      author.roundPoints += 1
      author.fooledCount += 1
    }
  })
  room.players.forEach((player) => {
    player.score = (player.score || 0) + player.roundPoints
  })
  room.phase = 'revealed'
  return true
}

function startQuestionTimer(room, expectedPhase = 'answering') {
  clearQuestionTimer(room)
  const questionIndex = room.questionIndex
  room.questionEndsAt = Date.now() + questionDurationMs
  room.questionTimer = setTimeout(() => {
    if (room.phase !== expectedPhase || room.questionIndex !== questionIndex) return
    if (room.gameType === 'bluff-battle') {
      if (expectedPhase === 'bluffing') openBluffVoting(room)
      else revealBluffRound(room)
    } else {
      revealQuestion(room)
    }
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

function prepareRoomGame(room, gameType, settings = {}) {
  const selectedGameType = gameTypes.has(gameType) ? gameType : 'one-percent'
  const isMajorityRules = selectedGameType === 'majority-rules'
  const isBluffBattle = selectedGameType === 'bluff-battle'

  clearQuestionTimer(room)
  room.gameType = selectedGameType
  room.questions = isMajorityRules
    ? selectMajorityPrompts(8, room.usedQuestionIds)
    : isBluffBattle
      ? selectBluffPrompts(5, room.usedQuestionIds)
      : selectQuestions(room.usedQuestionIds)
  room.settings = isMajorityRules
    ? { roundCount: 8 }
    : isBluffBattle
      ? { roundCount: 5 }
      : {
        lifelineCount: normalizeLifelineCount(settings.lifelineCount),
        lifelinesAnytime: Boolean(settings.lifelinesAnytime),
      }
  room.questionIndex = -1
  room.phase = 'lobby'
  room.finishReason = null
  room.roundResults = []
  room.majorityAnswers = []
  room.bluffOptions = []
  room.players.forEach((player) => {
    player.active = true
    player.hasAnswered = false
    player.answer = null
    player.isCorrect = null
    player.passedCurrentQuestion = false
    player.lifelinesRemaining = room.settings.lifelineCount || 0
    player.score = 0
    player.roundPoints = 0
    player.bluff = null
    player.voteOptionId = null
    player.fooledCount = 0
  })
}

io.on('connection', (socket) => {
  socket.on('host:create', ({ hostName, gameType, lifelineCount, lifelinesAnytime } = {}, callback) => {
    const code = makeCode()
    const usedQuestionIds = new Set()
    const selectedGameType = gameTypes.has(gameType) ? gameType : 'one-percent'
    const isMajorityRules = selectedGameType === 'majority-rules'
    const isBluffBattle = selectedGameType === 'bluff-battle'
    const room = {
      code,
      gameType: selectedGameType,
      hostName: String(hostName || 'Quizmaster').trim().slice(0, 24),
      hostSocketId: socket.id,
      socketIds: new Set([socket.id]),
      players: [],
      phase: 'lobby',
      finishReason: null,
      questionIndex: -1,
      questionEndsAt: null,
      questionTimer: null,
      questions: isMajorityRules
        ? selectMajorityPrompts(8, usedQuestionIds)
        : isBluffBattle
          ? selectBluffPrompts(5, usedQuestionIds)
          : selectQuestions(usedQuestionIds),
      usedQuestionIds,
      roundResults: [],
      majorityAnswers: [],
      bluffOptions: [],
      settings: {
        ...(isMajorityRules
          ? { roundCount: 8 }
          : isBluffBattle
            ? { roundCount: 5 }
            : {
              lifelineCount: normalizeLifelineCount(lifelineCount),
              lifelinesAnytime: Boolean(lifelinesAnytime),
            }),
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
      lifelinesRemaining: room.settings.lifelineCount || 0,
      score: 0,
      roundPoints: 0,
      bluff: null,
      voteOptionId: null,
      fooledCount: 0,
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
    const minimumPlayers = room.gameType === 'bluff-battle' ? 2 : 1
    if (room.players.length < minimumPlayers) {
      return replyError(
        callback,
        room.gameType === 'bluff-battle'
          ? 'Bluff Battle needs at least two players.'
          : 'At least one player must join.',
      )
    }
    room.questionIndex = 0
    room.phase = room.gameType === 'bluff-battle' ? 'bluffing' : 'answering'
    room.finishReason = null
    room.players.forEach((player) => {
      player.active = true
      player.hasAnswered = false
      player.answer = null
      player.isCorrect = null
      player.passedCurrentQuestion = false
      player.lifelinesRemaining = room.settings.lifelineCount || 0
      player.score = 0
      player.roundPoints = 0
      player.bluff = null
      player.voteOptionId = null
      player.fooledCount = 0
    })
    room.bluffOptions = []
    startQuestionTimer(room, room.phase)
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
    if (room.gameType !== 'one-percent') return replyError(callback, 'This game has no passes.')
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

  socket.on('player:bluff', ({ code, bluff } = {}, callback) => {
    const room = getRoom(code)
    const player = room?.players.find((item) => item.socketId === socket.id)
    const question = room?.questions[room.questionIndex]
    const cleanBluff = String(bluff || '').trim().slice(0, 100)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'bluff-battle' || room.phase !== 'bluffing') {
      return replyError(callback, 'Bluffs are closed.')
    }
    if (player.bluff) return replyError(callback, 'Your bluff is already locked.')
    if (!cleanBluff) return replyError(callback, 'Write a believable fake answer.')
    if (normalize(cleanBluff) === normalize(question.answer)) {
      return replyError(callback, 'Too accurate! Try a different bluff.')
    }
    if (
      room.players.some(
        (otherPlayer) =>
          otherPlayer.id !== player.id &&
          otherPlayer.bluff &&
          normalize(otherPlayer.bluff) === normalize(cleanBluff),
      )
    ) {
      return replyError(callback, 'Someone beat you to that bluff. Try another.')
    }
    player.bluff = cleanBluff
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('player:vote', ({ code, optionId } = {}, callback) => {
    const room = getRoom(code)
    const player = room?.players.find((item) => item.socketId === socket.id)
    const option = room?.bluffOptions.find((item) => item.id === optionId)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'bluff-battle' || room.phase !== 'voting') {
      return replyError(callback, 'Voting is closed.')
    }
    if (player.voteOptionId) return replyError(callback, 'Your vote is already locked.')
    if (!option) return replyError(callback, 'Choose an available answer.')
    if (option.authorPlayerId === player.id) return replyError(callback, 'You cannot vote for your own bluff.')
    player.voteOptionId = option.id
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:reveal', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can reveal.')
    if (room.gameType === 'bluff-battle') {
      if (room.phase === 'bluffing') openBluffVoting(room)
      else if (room.phase === 'voting') revealBluffRound(room)
      else return replyError(callback, 'There is nothing to reveal.')
    } else {
      if (room.phase !== 'answering') return replyError(callback, 'There is nothing to reveal.')
      revealQuestion(room)
    }
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
        player.roundPoints = 0
        player.bluff = null
        player.voteOptionId = null
        player.fooledCount = 0
      })
      room.roundResults = []
      room.majorityAnswers = []
      room.bluffOptions = []
      room.phase = room.gameType === 'bluff-battle' ? 'bluffing' : 'answering'
      startQuestionTimer(room, room.phase)
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
    if (room.phase !== 'finished') return replyError(callback, 'Finish the game before replaying.')
    prepareRoomGame(room, room.gameType, room.settings)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:return-to-games', ({ code } = {}, callback) => {
    const room = getRoom(code)
    if (!room || room.hostSocketId !== socket.id) return replyError(callback, 'Only the host can choose the next game.')
    if (room.phase !== 'finished') return replyError(callback, 'Finish the current game first.')
    clearQuestionTimer(room)
    room.phase = 'game-select'
    room.players.forEach((player) => {
      player.active = true
      player.hasAnswered = false
      player.isCorrect = null
      player.passedCurrentQuestion = false
      player.roundPoints = 0
    })
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on(
    'host:select-game',
    ({ code, gameType, lifelineCount, lifelinesAnytime } = {}, callback) => {
      const room = getRoom(code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can choose the next game.')
      }
      if (room.phase !== 'game-select') return replyError(callback, 'The game picker is not open.')
      if (!gameTypes.has(gameType)) return replyError(callback, 'Choose an available game.')
      prepareRoomGame(room, gameType, { lifelineCount, lifelinesAnytime })
      callback?.({ ok: true })
      broadcast(room)
    },
  )

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
