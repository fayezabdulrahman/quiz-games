import {
  createPlayer,
  normalize,
  questionsForGame,
  resetPlayer,
  resetPlayerForNextQuestion,
  settingsForGame,
} from '../game/helpers.js'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

function replyError(callback, message) {
  callback?.({ ok: false, error: message })
}

function makeCode(rooms) {
  let code = ''
  do {
    code = Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('')
  } while (rooms.has(code))
  return code
}

function getRoom(rooms, code) {
  return rooms.get(String(code || '').trim().toUpperCase())
}

function prepareRoomGame(room, gameType, settings, clearQuestionTimer) {
  clearQuestionTimer(room)
  room.gameType = gameType
  room.questions = questionsForGame(gameType, room.usedQuestionIds)
  room.settings = settingsForGame(gameType, settings)
  room.questionIndex = -1
  room.phase = 'lobby'
  room.finishReason = null
  room.roundResults = []
  room.majorityAnswers = []
  room.bluffOptions = []
  room.players.forEach((player) => {
    resetPlayer(player, room.settings, true)
  })
}

export function registerSocketHandlers({
  io,
  rooms,
  gameTypes,
  broadcast,
  roundController,
}) {
  const {
    clearQuestionTimer,
    closeExpiredQuestion,
    openBluffVoting,
    revealBluffRound,
    revealQuestion,
    startQuestionTimer,
  } = roundController

  io.on('connection', (socket) => {
    socket.on(
      'host:create',
      ({ hostName, gameType, lifelineCount, lifelinesAnytime } = {}, callback) => {
        const code = makeCode(rooms)
        const usedQuestionIds = new Set()
        const selectedGameType = gameTypes.has(gameType) ? gameType : 'one-percent'
        const settings = settingsForGame(selectedGameType, {
          lifelineCount,
          lifelinesAnytime,
        })
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
          questions: questionsForGame(selectedGameType, usedQuestionIds),
          usedQuestionIds,
          roundResults: [],
          majorityAnswers: [],
          bluffOptions: [],
          settings,
        }
        rooms.set(code, room)
        socket.join(code)
        callback?.({ ok: true, code })
        broadcast(room)
      },
    )

    socket.on('player:join', ({ code, name } = {}, callback) => {
      const room = getRoom(rooms, code)
      const cleanName = String(name || '').trim().slice(0, 20)
      if (!room) return replyError(callback, 'That room code does not exist.')
      if (room.phase !== 'lobby') return replyError(callback, 'This game has already started.')
      if (!cleanName) return replyError(callback, 'Enter a player name.')
      if (room.players.some((player) => player.name.toLowerCase() === cleanName.toLowerCase())) {
        return replyError(callback, 'That name is already in use.')
      }

      room.players.push(createPlayer(socket.id, cleanName, room.settings))
      room.socketIds.add(socket.id)
      socket.join(room.code)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:start', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can start.')
      }
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
        resetPlayer(player, room.settings, true)
      })
      room.bluffOptions = []
      startQuestionTimer(room, room.phase)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:answer', ({ code, answer } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
      if (room.phase !== 'answering') return replyError(callback, 'Answers are closed.')
      if (!player.active) return replyError(callback, 'You are spectating this round.')
      if (player.hasAnswered) return replyError(callback, 'Your answer is already locked.')
      if (!String(answer || '').trim()) {
        return replyError(callback, 'Choose or enter an answer.')
      }

      player.answer = String(answer).trim().slice(0, 120)
      player.hasAnswered = true
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:pass', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      const question = room?.questions[room.questionIndex]
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
      if (room.phase !== 'answering') return replyError(callback, 'Answers are closed.')
      if (room.gameType !== 'one-percent') return replyError(callback, 'This game has no passes.')
      if (!player.active) return replyError(callback, 'You are spectating this round.')
      if (player.hasAnswered) return replyError(callback, 'Your response is already locked.')
      if (player.lifelinesRemaining < 1) {
        return replyError(callback, 'You have no passes remaining.')
      }
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
      const room = getRoom(rooms, code)
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
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      const option = room?.bluffOptions.find((item) => item.id === optionId)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (room.gameType !== 'bluff-battle' || room.phase !== 'voting') {
        return replyError(callback, 'Voting is closed.')
      }
      if (player.voteOptionId) return replyError(callback, 'Your vote is already locked.')
      if (!option) return replyError(callback, 'Choose an available answer.')
      if (option.authorPlayerId === player.id) {
        return replyError(callback, 'You cannot vote for your own bluff.')
      }
      player.voteOptionId = option.id
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:reveal', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can reveal.')
      }
      if (room.gameType === 'bluff-battle') {
        if (room.phase === 'bluffing') openBluffVoting(room)
        else if (room.phase === 'voting') revealBluffRound(room)
        else return replyError(callback, 'There is nothing to reveal.')
      } else {
        if (room.phase !== 'answering') {
          return replyError(callback, 'There is nothing to reveal.')
        }
        revealQuestion(room)
      }
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:next', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can continue.')
      }
      if (room.phase !== 'revealed') return replyError(callback, 'Reveal the answer first.')
      if (room.questionIndex >= room.questions.length - 1) {
        room.phase = 'finished'
        room.finishReason = 'completed'
      } else {
        room.questionIndex += 1
        room.players.forEach(resetPlayerForNextQuestion)
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
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can end the game.')
      }
      if (room.phase !== 'revealed') {
        return replyError(callback, 'End the game after revealing the answer.')
      }
      clearQuestionTimer(room)
      room.phase = 'finished'
      room.finishReason = 'host-ended'
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:restart', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can restart.')
      }
      if (room.phase !== 'finished') {
        return replyError(callback, 'Finish the game before replaying.')
      }
      prepareRoomGame(room, room.gameType, room.settings, clearQuestionTimer)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:return-to-games', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can choose the next game.')
      }
      if (room.phase !== 'finished') {
        return replyError(callback, 'Finish the current game first.')
      }
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
        const room = getRoom(rooms, code)
        if (!room || room.hostSocketId !== socket.id) {
          return replyError(callback, 'Only the host can choose the next game.')
        }
        if (room.phase !== 'game-select') {
          return replyError(callback, 'The game picker is not open.')
        }
        if (!gameTypes.has(gameType)) return replyError(callback, 'Choose an available game.')
        prepareRoomGame(
          room,
          gameType,
          { lifelineCount, lifelinesAnytime },
          clearQuestionTimer,
        )
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
  })
}
