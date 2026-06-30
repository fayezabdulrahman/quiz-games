import { questionsForGame } from '../game/helpers.js'
import { getRoom, getSocketPlayer, replyError } from './utils.js'

export function createQuickfireTeams() {
  return [
    { id: 'coral', name: 'Team A', position: 0, playerIds: [] },
    { id: 'blue', name: 'Team B', position: 0, playerIds: [] },
  ]
}

export function syncQuickfireTeamPlayers(room) {
  room.quickfireTeams.forEach((team) => {
    team.playerIds = room.players
      .filter((player) => player.teamId === team.id)
      .map((player) => player.id)
  })
}

export function quickfireDescriber(room) {
  const team = room.quickfireTeams[room.quickfireActiveTeamIndex]
  if (!team?.playerIds.length) return null
  const turnCount = room.quickfireTeamTurnCounts[team.id] || 0
  return team.playerIds[turnCount % team.playerIds.length]
}

export function startQuickfireTurn(room, clearQuestionTimer) {
  clearQuestionTimer(room)
  room.quickfireActivePlayerId = quickfireDescriber(room)
  room.quickfireDie = null
  room.quickfireCorrectTermIndexes = []
  room.quickfireLastMove = null
  room.phase = 'quickfire-roll'
}

export function registerQuickfireHandlers({
  socket,
  rooms,
  broadcast,
  clearQuestionTimer,
  questionDurationMs,
}) {
  function finishQuickfireTimer(room) {
    if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-describing') return
    clearQuestionTimer(room)
    room.phase = 'quickfire-scoring'
    broadcast(room)
  }

  function startQuickfireTimer(room) {
    clearQuestionTimer(room)
    room.questionEndsAt = Date.now() + questionDurationMs
    room.questionTimer = setTimeout(() => finishQuickfireTimer(room), questionDurationMs)
  }

  socket.on('host:quickfire-assign', ({ code, playerId, teamId } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!room || room.hostSocketId !== socket.id) {
      return replyError(callback, 'Only the host can assign teams.')
    }
    if (room.gameType !== 'quickfire-30' || room.phase !== 'lobby') {
      return replyError(callback, 'Teams can only be changed in the Quickfire 30 lobby.')
    }
    const player = room.players.find((item) => item.id === playerId)
    if (!player || !['coral', 'blue'].includes(teamId)) {
      return replyError(callback, 'Choose a player and team.')
    }
    player.teamId = teamId
    syncQuickfireTeamPlayers(room)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:quickfire-randomize', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!room || room.hostSocketId !== socket.id) {
      return replyError(callback, 'Only the host can assign teams.')
    }
    if (room.gameType !== 'quickfire-30' || room.phase !== 'lobby') {
      return replyError(callback, 'Teams can only be changed in the Quickfire 30 lobby.')
    }
    const shuffled = [...room.players].sort(() => Math.random() - 0.5)
    shuffled.forEach((player, index) => {
      player.teamId = index % 2 === 0 ? 'coral' : 'blue'
    })
    syncQuickfireTeamPlayers(room)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('player:quickfire-roll', ({ code, value } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-roll') {
      return replyError(callback, 'The die cannot be rolled right now.')
    }
    if (player.id !== room.quickfireActivePlayerId) {
      return replyError(callback, 'The current describer rolls the die.')
    }
    if (room.settings.diceMode === 'manual') {
      const manualValue = Number(value)
      if (![0, 1, 2].includes(manualValue)) {
        return replyError(callback, 'Enter the 0, 1 or 2 shown on your physical die.')
      }
      room.quickfireDie = manualValue
    } else {
      room.quickfireDie = Math.floor(Math.random() * 3)
    }
    room.phase = 'quickfire-ready'
    callback?.({ ok: true, value: room.quickfireDie })
    broadcast(room)
  })

  socket.on('player:quickfire-draw', async ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-ready') {
      return replyError(callback, 'Roll the die before drawing a card.')
    }
    if (player.id !== room.quickfireActivePlayerId) {
      return replyError(callback, 'Only the current describer can draw the card.')
    }
    if (room.questionIndex >= room.questions.length - 1) {
      try {
        room.questions = await questionsForGame('quickfire-30', room.usedQuestionIds)
      } catch (error) {
        console.error('Failed to refill Quickfire 30 cards', error)
        return replyError(callback, 'Could not load another Quickfire card.')
      }
      room.questionIndex = -1
    }
    room.questionIndex += 1
    room.phase = 'quickfire-describing'
    startQuickfireTimer(room)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('player:quickfire-score', ({ code, correctTermIndexes } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
    if (!room || !player) return replyError(callback, 'You are not in this room.')
    if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-scoring') {
      return replyError(callback, 'Scoring is not open.')
    }
    if (player.id !== room.quickfireActivePlayerId) {
      return replyError(callback, 'The describer records the correct answers.')
    }
    const indexes = [...new Set(Array.isArray(correctTermIndexes) ? correctTermIndexes : [])]
      .map(Number)
      .filter((index) => Number.isInteger(index) && index >= 0 && index < 5)
    const team = room.quickfireTeams[room.quickfireActiveTeamIndex]
    const move = Math.max(0, indexes.length - room.quickfireDie)
    room.quickfireCorrectTermIndexes = indexes
    team.position = Math.min(room.settings.boardLength, team.position + move)
    room.quickfireLastMove = {
      teamId: team.id,
      correctCount: indexes.length,
      die: room.quickfireDie,
      move,
    }
    room.quickfireTeamTurnCounts[team.id] += 1
    if (team.position >= room.settings.boardLength) {
      room.phase = 'finished'
      room.finishReason = 'completed'
    } else {
      room.phase = 'quickfire-result'
    }
    callback?.({ ok: true, move })
    broadcast(room)
  })

  socket.on('host:quickfire-next', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!room || room.hostSocketId !== socket.id) {
      return replyError(callback, 'Only the host can start the next turn.')
    }
    if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-result') {
      return replyError(callback, 'Finish scoring this turn first.')
    }
    room.quickfireActiveTeamIndex = (room.quickfireActiveTeamIndex + 1) % 2
    startQuickfireTurn(room, clearQuestionTimer)
    callback?.({ ok: true })
    broadcast(room)
  })

  socket.on('host:quickfire-end', ({ code } = {}, callback) => {
    const room = getRoom(rooms, code)
    if (!room || room.hostSocketId !== socket.id) {
      return replyError(callback, 'Only the host can end the game.')
    }
    if (room.gameType !== 'quickfire-30' || room.phase === 'lobby') {
      return replyError(callback, 'Quickfire 30 is not in progress.')
    }
    clearQuestionTimer(room)
    room.phase = 'finished'
    room.finishReason = 'host-ended'
    callback?.({ ok: true })
    broadcast(room)
  })
}
