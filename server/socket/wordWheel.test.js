import assert from 'node:assert/strict'
import test from 'node:test'
import { registerWordWheelHandlers } from './wordWheel.js'

function createSocket(id) {
  const handlers = new Map()
  return {
    id,
    handlers,
    on(event, handler) {
      handlers.set(event, handler)
    },
  }
}

function createRoom() {
  return {
    code: 'TEST',
    gameType: 'word-wheel',
    hostSocketId: 'host-socket',
    hostUserId: null,
    hostClerkUserId: null,
    phase: 'word-wheel-playing',
    questionIndex: 0,
    questionEndsAt: Date.now() + 15_000,
    questionTimer: null,
    questions: [{ id: 'category-1', prompt: 'Anything' }],
    settings: { inputMode: 'type', turnSeconds: 15, targetScore: 5 },
    players: [
      {
        id: 'player-1',
        socketId: 'player-socket',
        name: 'Player one',
        active: true,
        hasAnswered: false,
        answer: null,
        score: 0,
      },
      {
        id: 'player-2',
        socketId: 'other-socket',
        name: 'Player two',
        active: true,
        hasAnswered: false,
        answer: null,
        score: 0,
      },
    ],
    wordWheelActivePlayerId: 'player-1',
    wordWheelUsedLetters: [],
    wordWheelSubmissions: [],
    wordWheelLastSubmissionId: null,
    wordWheelPendingSubmissionId: null,
    wordWheelLastMove: null,
    wordWheelTimerRemainingMs: null,
    wordWheelRoundWinnerId: null,
    wordWheelRoundWinnerName: null,
    wordWheelRoundEndReason: null,
  }
}

function clearQuestionTimer(room) {
  if (room.questionTimer) clearTimeout(room.questionTimer)
  room.questionTimer = null
  room.questionEndsAt = null
}

function register(socket, room) {
  registerWordWheelHandlers({
    socket,
    rooms: new Map([[room.code, room]]),
    broadcast: () => {},
    clearQuestionTimer,
    approveWord: async () => true,
  })
}

function invoke(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    const result = socket.handlers.get(event)(payload, resolve)
    Promise.resolve(result).catch(reject)
  })
}

test('pauses an unrecognized word for host review', async () => {
  const room = createRoom()
  const playerSocket = createSocket('player-socket')
  register(playerSocket, room)

  const result = await invoke(playerSocket, 'player:word-wheel-submit', {
    code: room.code,
    letter: 'Z',
    word: 'zzzznotaword',
  })

  assert.equal(result.ok, true)
  assert.equal(result.dictionaryStatus, 'unrecognized')
  assert.equal(room.phase, 'word-wheel-paused')
  assert.equal(room.wordWheelActivePlayerId, 'player-1')
  assert.equal(room.wordWheelTimerRemainingMs, 15_000)
  assert.equal(room.wordWheelPendingSubmissionId, room.wordWheelLastSubmissionId)
  assert.equal(room.questionEndsAt, null)
})

test('accepting a reviewed word starts the next player with a full timer', async () => {
  const room = createRoom()
  const playerSocket = createSocket('player-socket')
  const hostSocket = createSocket('host-socket')
  register(playerSocket, room)
  register(hostSocket, room)

  await invoke(playerSocket, 'player:word-wheel-submit', {
    code: room.code,
    letter: 'Z',
    word: 'zzzznotaword',
  })
  const pendingSubmissionId = room.wordWheelPendingSubmissionId
  const acceptedAt = Date.now()
  const result = await invoke(hostSocket, 'host:word-wheel-accept-word', {
    code: room.code,
    submissionId: pendingSubmissionId,
  })

  assert.equal(result.ok, true)
  assert.equal(room.phase, 'word-wheel-playing')
  assert.equal(room.wordWheelActivePlayerId, 'player-2')
  assert.equal(room.wordWheelPendingSubmissionId, null)
  assert.equal(room.wordWheelSubmissions[0].dictionaryStatus, 'host-approved')
  assert.ok(room.questionEndsAt >= acceptedAt + 14_900)
  clearQuestionTimer(room)
})

test('rejecting a reviewed word returns the same player with a full timer', async () => {
  const room = createRoom()
  const playerSocket = createSocket('player-socket')
  const hostSocket = createSocket('host-socket')
  register(playerSocket, room)
  register(hostSocket, room)

  await invoke(playerSocket, 'player:word-wheel-submit', {
    code: room.code,
    letter: 'Z',
    word: 'zzzznotaword',
  })
  const pendingSubmissionId = room.wordWheelPendingSubmissionId
  const rejectedAt = Date.now()
  const result = await invoke(hostSocket, 'host:word-wheel-reject-word', {
    code: room.code,
    submissionId: pendingSubmissionId,
  })

  assert.equal(result.ok, true)
  assert.equal(room.phase, 'word-wheel-playing')
  assert.equal(room.wordWheelActivePlayerId, 'player-1')
  assert.equal(room.wordWheelPendingSubmissionId, null)
  assert.deepEqual(room.wordWheelUsedLetters, [])
  assert.equal(room.wordWheelSubmissions[0].revoked, true)
  assert.ok(room.questionEndsAt >= rejectedAt + 14_900)
  clearQuestionTimer(room)
})

test('claiming the final available letter ends the category instead of resetting letters', async () => {
  const room = createRoom()
  room.wordWheelUsedLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('')
  const playerSocket = createSocket('player-socket')
  register(playerSocket, room)

  const result = await invoke(playerSocket, 'player:word-wheel-submit', {
    code: room.code,
    letter: 'Z',
    word: 'zebra',
  })

  assert.equal(result.ok, true)
  assert.equal(result.dictionaryStatus, 'recognized')
  assert.equal(room.phase, 'word-wheel-round-over')
  assert.equal(room.wordWheelRoundEndReason, 'letters-complete')
  assert.equal(room.wordWheelRoundWinnerId, 'player-1')
  assert.equal(room.players[0].score, 1)
  assert.equal(room.wordWheelUsedLetters.length, 26)
})
