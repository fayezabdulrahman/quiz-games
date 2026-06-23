import crypto from 'node:crypto'
import {
  createPlayer,
  correctAnswer,
  createSurveyTeams,
  normalize,
  questionsForGame,
  resetPlayer,
  resetPlayerForNextQuestion,
  settingsForGame,
} from '../game/helpers.js'
import { selectMillionLadderReplacement } from '../questions/millionLadder/index.js'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const hostReconnectGraceMs = 15 * 60 * 1000

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

function cleanSessionToken(value = '') {
  return String(value || '').trim().slice(0, 80)
}

function setHostSocket(room, socket) {
  if (room.hostReconnectTimer) {
    clearTimeout(room.hostReconnectTimer)
    room.hostReconnectTimer = null
  }
  room.hostSocketId = socket.id
  room.socketIds.add(socket.id)
  socket.join(room.code)
}

function setPlayerSocket(room, player, socket) {
  if (player.socketId && player.socketId !== socket.id) {
    room.socketIds.delete(player.socketId)
  }
  player.socketId = socket.id
  player.connected = true
  room.socketIds.add(socket.id)
  socket.join(room.code)
}

function closeRoom({ io, rooms, room, clearQuestionTimer }) {
  if (room.hostReconnectTimer) {
    clearTimeout(room.hostReconnectTimer)
    room.hostReconnectTimer = null
  }
  clearQuestionTimer(room)
  io.to(room.code).emit('room:closed')
  rooms.delete(room.code)
}

function surveyFaceoffPlayer(room, team, pairIndex = room.surveyFaceoffPairIndex) {
  return team.playerIds[pairIndex % team.playerIds.length]
}

function startSurveyFaceoff(room) {
  const startingTeam = room.surveyTeams[room.questionIndex % room.surveyTeams.length]
  room.surveyFaceoffPairIndex = 0
  room.surveyFaceoffGuesses = []
  room.surveyControlChooserPlayerId = null
  room.surveyActiveTeamId = startingTeam.id
  room.surveyActivePlayerId = surveyFaceoffPlayer(room, startingTeam)
  room.phase = 'survey-faceoff'
}

function nextSurveyTeamPlayer(team, currentPlayerId) {
  const currentIndex = team.playerIds.indexOf(currentPlayerId)
  return team.playerIds[(Math.max(0, currentIndex) + 1) % team.playerIds.length]
}

function createEmptySurveyTeams() {
  return [
    { id: 'lime', name: 'Lime Team', score: 0, playerIds: [] },
    { id: 'violet', name: 'Violet Team', score: 0, playerIds: [] },
  ]
}

function syncSurveyTeamPlayers(room) {
  if (!room.surveyTeams.length) room.surveyTeams = createEmptySurveyTeams()
  room.surveyTeams.forEach((team) => {
    team.playerIds = room.players
      .filter((player) => player.teamId === team.id)
      .map((player) => player.id)
  })
}

function assignSurveyPlayerToSmallestTeam(room, player) {
  if (!room.surveyTeams.length) room.surveyTeams = createEmptySurveyTeams()
  syncSurveyTeamPlayers(room)
  const targetTeam = [...room.surveyTeams].sort(
    (first, second) => first.playerIds.length - second.playerIds.length,
  )[0]
  player.teamId = targetTeam?.id || 'lime'
  syncSurveyTeamPlayers(room)
}

function createQuickfireTeams() {
  return [
    { id: 'coral', name: 'Team A', position: 0, playerIds: [] },
    { id: 'blue', name: 'Team B', position: 0, playerIds: [] },
  ]
}

function syncQuickfireTeamPlayers(room) {
  room.quickfireTeams.forEach((team) => {
    team.playerIds = room.players
      .filter((player) => player.teamId === team.id)
      .map((player) => player.id)
  })
}

function quickfireDescriber(room) {
  const team = room.quickfireTeams[room.quickfireActiveTeamIndex]
  if (!team?.playerIds.length) return null
  const turnCount = room.quickfireTeamTurnCounts[team.id] || 0
  return team.playerIds[turnCount % team.playerIds.length]
}

function prepareRoomGame(room, gameType, settings, clearQuestionTimer) {
  clearQuestionTimer(room)
  room.gameType = gameType
  room.settings = settingsForGame(gameType, settings)
  room.questions = questionsForGame(gameType, room.usedQuestionIds, room.settings)
  room.questionIndex = -1
  room.phase = 'lobby'
  room.finishReason = null
  room.roundResults = []
  room.majorityAnswers = []
  room.bluffOptions = []
  room.ladderReached = -1
  room.ladderResult = null
  room.ladderHiddenOptions = []
  room.ladderLifelines = { fiftyFifty: false, askRoom: false, skipQuestion: false }
  room.ladderPollActive = false
  room.ladderAudienceVotingOpen = false
  room.ladderTimerRemainingMs = null
  room.surveyTeams = gameType === 'survey-showdown' ? createEmptySurveyTeams() : []
  room.surveyRevealedAnswerIds = []
  room.surveyStrikes = 0
  room.surveyRoundBank = 0
  room.surveyActiveTeamId = null
  room.surveyActivePlayerId = null
  room.surveyRoundWinnerTeamId = null
  room.surveyLastGuess = null
  room.surveyFaceoffPairIndex = 0
  room.surveyFaceoffGuesses = []
  room.surveyControlChooserPlayerId = null
  room.quickfireTeams = createQuickfireTeams()
  room.quickfireActiveTeamIndex = 0
  room.quickfireTeamTurnCounts = { coral: 0, blue: 0 }
  room.quickfireActivePlayerId = null
  room.quickfireDie = null
  room.quickfireCorrectTermIndexes = []
  room.quickfireLastMove = null
  room.catchphraseBuzzerPlayerId = null
  room.catchphraseTimerRemainingMs = null
  room.catchphraseLastGuess = null
  room.players.forEach((player) => {
    resetPlayer(player, room.settings, true)
  })
  room.players.forEach((player, index) => {
    player.ladderRole = gameType === 'million-ladder'
      ? index === 0
        ? 'contestant'
        : 'audience'
      : null
  })
  if (gameType === 'survey-showdown') {
    room.surveyTeams = createSurveyTeams(room.players)
  }
}

export function registerSocketHandlers({
  io,
  rooms,
  gameTypes,
  broadcast,
  roundController,
  questionDurationMs,
}) {
  const {
    clearQuestionTimer,
    closeExpiredQuestion,
    openBluffVoting,
    revealBluffRound,
    revealQuestion,
    startQuestionTimer,
    pauseQuestionTimer,
    resumeQuestionTimer,
  } = roundController

  function startQuickfireTurn(room) {
    clearQuestionTimer(room)
    room.quickfireActivePlayerId = quickfireDescriber(room)
    room.quickfireDie = null
    room.quickfireCorrectTermIndexes = []
    room.quickfireLastMove = null
    room.phase = 'quickfire-roll'
  }

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

  function startRoomQuestionTimer(room) {
    if (room.gameType === 'million-ladder' && room.questionIndex >= 5) {
      clearQuestionTimer(room)
      return
    }
    startQuestionTimer(room, room.phase)
  }

  function finishAudienceVoteIfReady(room) {
    if (room.gameType !== 'million-ladder' || !room.ladderAudienceVotingOpen) return
    const audience = room.players.filter(
      (player) => player.ladderRole === 'audience' && player.connected,
    )
    if (!audience.length || !audience.every((player) => player.hasAnswered)) return
    room.ladderAudienceVotingOpen = false
    if (room.questionIndex < 5 && room.ladderTimerRemainingMs > 0) {
      resumeQuestionTimer(room, room.ladderTimerRemainingMs)
    }
    room.ladderTimerRemainingMs = null
  }

  io.on('connection', (socket) => {
    socket.on('room:restore', ({ code, sessionToken } = {}, callback) => {
      const room = getRoom(rooms, code)
      const token = cleanSessionToken(sessionToken)
      if (!room || !token) return replyError(callback, 'This room is no longer available.')

      if (room.hostSessionToken === token) {
        setHostSocket(room, socket)
        callback?.({ ok: true, role: 'host' })
        broadcast(room)
        return
      }

      const player = room.players.find((item) => item.sessionToken === token)
      if (!player) return replyError(callback, 'This room is no longer available.')

      setPlayerSocket(room, player, socket)
      finishAudienceVoteIfReady(room)
      callback?.({ ok: true, role: 'player' })
      broadcast(room)
    })

    socket.on(
      'host:create',
      (
        { gameType, lifelineCount, lifelinesAnytime, diceMode, roundCount, sessionToken } = {},
        callback,
      ) => {
        const code = makeCode(rooms)
        const hostSessionToken = cleanSessionToken(sessionToken) || crypto.randomUUID()
        const usedQuestionIds = new Set()
        const selectedGameType = gameTypes.has(gameType) ? gameType : 'one-percent'
        const settings = settingsForGame(selectedGameType, {
          lifelineCount,
          lifelinesAnytime,
          diceMode,
          roundCount,
        })
        const room = {
          code,
          gameType: selectedGameType,
          hostSocketId: socket.id,
          hostSessionToken,
          hostReconnectTimer: null,
          socketIds: new Set([socket.id]),
          players: [],
          phase: 'lobby',
          finishReason: null,
          questionIndex: -1,
          questionEndsAt: null,
          questionTimer: null,
          questions: questionsForGame(selectedGameType, usedQuestionIds, settings),
          usedQuestionIds,
          roundResults: [],
          majorityAnswers: [],
          bluffOptions: [],
          ladderReached: -1,
          ladderResult: null,
          ladderHiddenOptions: [],
          ladderLifelines: { fiftyFifty: false, askRoom: false, skipQuestion: false },
          ladderPollActive: false,
          ladderAudienceVotingOpen: false,
          ladderTimerRemainingMs: null,
          surveyTeams: selectedGameType === 'survey-showdown' ? createEmptySurveyTeams() : [],
          surveyRevealedAnswerIds: [],
          surveyStrikes: 0,
          surveyRoundBank: 0,
          surveyActiveTeamId: null,
          surveyActivePlayerId: null,
          surveyRoundWinnerTeamId: null,
          surveyLastGuess: null,
          surveyFaceoffPairIndex: 0,
          surveyFaceoffGuesses: [],
          surveyControlChooserPlayerId: null,
          quickfireTeams: createQuickfireTeams(),
          quickfireActiveTeamIndex: 0,
          quickfireTeamTurnCounts: { coral: 0, blue: 0 },
          quickfireActivePlayerId: null,
          quickfireDie: null,
          quickfireCorrectTermIndexes: [],
          quickfireLastMove: null,
          catchphraseBuzzerPlayerId: null,
          catchphraseTimerRemainingMs: null,
          catchphraseLastGuess: null,
          settings,
        }
        rooms.set(code, room)
        socket.join(code)
        callback?.({ ok: true, code, sessionToken: hostSessionToken })
        broadcast(room)
      },
    )

    socket.on('player:join', ({ code, name, sessionToken } = {}, callback) => {
      const room = getRoom(rooms, code)
      const cleanName = String(name || '').trim().slice(0, 20)
      const playerSessionToken = cleanSessionToken(sessionToken)
      if (!room) return replyError(callback, 'That room code does not exist.')
      if (room.phase !== 'lobby') return replyError(callback, 'This game has already started.')
      if (!cleanName) return replyError(callback, 'Enter a player name.')
      if (room.players.some((player) => player.name.toLowerCase() === cleanName.toLowerCase())) {
        return replyError(callback, 'That name is already in use.')
      }

      const player = createPlayer(socket.id, cleanName, room.settings)
      player.sessionToken = playerSessionToken || player.sessionToken
      if (room.gameType === 'million-ladder') {
        player.ladderRole = room.players.some((item) => item.ladderRole === 'contestant')
          ? 'audience'
          : 'contestant'
      }
      room.players.push(player)
      if (room.gameType === 'survey-showdown') {
        assignSurveyPlayerToSmallestTeam(room, player)
      }
      room.socketIds.add(socket.id)
      socket.join(room.code)
      callback?.({ ok: true, sessionToken: player.sessionToken })
      broadcast(room)
    })

    socket.on('host:start', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can start.')
      }
      const minimumPlayers =
        ['bluff-battle', 'survey-showdown', 'quickfire-30'].includes(room.gameType) ? 2 : 1
      if (room.players.length < minimumPlayers) {
        return replyError(
          callback,
          ['bluff-battle', 'survey-showdown', 'quickfire-30'].includes(room.gameType)
            ? `${room.gameType === 'bluff-battle' ? 'Bluff Battle' : room.gameType === 'survey-showdown' ? 'Survey Showdown' : 'Quickfire 30'} needs at least two players.`
            : 'At least one player must join.',
        )
      }
      if (room.gameType === 'quickfire-30') {
        syncQuickfireTeamPlayers(room)
        if (room.quickfireTeams.some((team) => team.playerIds.length === 0)) {
          return replyError(callback, 'Assign at least one player to each team.')
        }
      } else if (room.gameType === 'survey-showdown') {
        syncSurveyTeamPlayers(room)
        if (
          room.players.some((player) => !player.teamId) ||
          room.surveyTeams.some((team) => team.playerIds.length === 0)
        ) {
          return replyError(callback, 'Assign at least one player to each survey team.')
        }
      }

      room.questionIndex = 0
      const surveyAssignments = new Map(room.players.map((player) => [player.id, player.teamId]))
      room.players.forEach((player) => {
        resetPlayer(player, room.settings, true)
      })
      if (room.gameType === 'survey-showdown') {
        room.players.forEach((player) => {
          player.teamId = surveyAssignments.get(player.id) || null
        })
        syncSurveyTeamPlayers(room)
        room.surveyTeams.forEach((team) => {
          team.score = 0
        })
        startSurveyFaceoff(room)
      } else if (room.gameType === 'quickfire-30') {
        room.questionIndex = -1
        room.quickfireTeams.forEach((team) => {
          team.playerIds.forEach((playerId) => {
            const player = room.players.find((item) => item.id === playerId)
            if (player) player.teamId = team.id
          })
        })
        room.quickfireTeams.forEach((team) => {
          team.position = 0
        })
        room.quickfireActiveTeamIndex = 0
        room.quickfireTeamTurnCounts = { coral: 0, blue: 0 }
        startQuickfireTurn(room)
      } else {
        room.phase = room.gameType === 'bluff-battle' ? 'bluffing' : 'answering'
      }
      room.finishReason = null
      room.bluffOptions = []
      if (room.gameType !== 'survey-showdown') startRoomQuestionTimer(room)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:survey-assign', ({ code, playerId, teamId } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can assign teams.')
      }
      if (room.gameType !== 'survey-showdown' || room.phase !== 'lobby') {
        return replyError(callback, 'Teams can only be changed in the Survey Showdown lobby.')
      }
      const player = room.players.find((item) => item.id === playerId)
      if (!player || !['lime', 'violet'].includes(teamId)) {
        return replyError(callback, 'Choose a player and team.')
      }
      player.teamId = teamId
      syncSurveyTeamPlayers(room)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('host:survey-randomize', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can assign teams.')
      }
      if (room.gameType !== 'survey-showdown' || room.phase !== 'lobby') {
        return replyError(callback, 'Teams can only be changed in the Survey Showdown lobby.')
      }
      const shuffled = [...room.players].sort(() => Math.random() - 0.5)
      shuffled.forEach((player, index) => {
        player.teamId = index % 2 === 0 ? 'lime' : 'violet'
      })
      syncSurveyTeamPlayers(room)
      callback?.({ ok: true })
      broadcast(room)
    })

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
      const player = room?.players.find((item) => item.socketId === socket.id)
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

    socket.on('player:quickfire-draw', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-ready') {
        return replyError(callback, 'Roll the die before drawing a card.')
      }
      if (player.id !== room.quickfireActivePlayerId) {
        return replyError(callback, 'Only the current describer can draw the card.')
      }
      if (room.questionIndex >= room.questions.length - 1) {
        room.questions = questionsForGame('quickfire-30', room.usedQuestionIds)
        room.questionIndex = -1
      }
      room.questionIndex += 1
      room.phase = 'quickfire-describing'
      startQuickfireTimer(room)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on(
      'player:quickfire-score',
      ({ code, correctTermIndexes } = {}, callback) => {
        const room = getRoom(rooms, code)
        const player = room?.players.find((item) => item.socketId === socket.id)
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
      },
    )

    socket.on('host:quickfire-next', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can start the next turn.')
      }
      if (room.gameType !== 'quickfire-30' || room.phase !== 'quickfire-result') {
        return replyError(callback, 'Finish scoring this turn first.')
      }
      room.quickfireActiveTeamIndex = (room.quickfireActiveTeamIndex + 1) % 2
      startQuickfireTurn(room)
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

    socket.on('player:survey-guess', ({ code, guess } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      const question = room?.questions[room.questionIndex]
      const cleanGuess = String(guess || '').trim().slice(0, 80)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (
        room.gameType !== 'survey-showdown' ||
        !['survey-faceoff', 'survey-playing', 'survey-steal'].includes(room.phase)
      ) {
        return replyError(callback, 'Guesses are closed.')
      }
      if (player.id !== room.surveyActivePlayerId) {
        return replyError(callback, 'Wait for your turn to guess.')
      }
      if (!cleanGuess) return replyError(callback, 'Enter a survey answer.')

      const multiplier = room.questionIndex < 3 ? 1 : room.questionIndex < 5 ? 2 : 3
      const matchedIndex = question.answers.findIndex(
        (item, index) =>
          !room.surveyRevealedAnswerIds.includes(index) &&
          item.accepted.some((accepted) => normalize(accepted) === normalize(cleanGuess)),
      )
      const isMatch = matchedIndex >= 0
      room.surveyLastGuess = { playerName: player.name, guess: cleanGuess, isMatch }

      const activeTeam = room.surveyTeams.find((team) => team.id === room.surveyActiveTeamId)
      const otherTeam = room.surveyTeams.find((team) => team.id !== room.surveyActiveTeamId)
      if (isMatch) {
        room.surveyRevealedAnswerIds.push(matchedIndex)
        room.surveyRoundBank += question.answers[matchedIndex].points * multiplier
      }

      const finishRound = (winnerTeam) => {
        winnerTeam.score += room.surveyRoundBank
        room.surveyRoundWinnerTeamId = winnerTeam.id
        room.phase = 'revealed'
        room.surveyRevealedAnswerIds = question.answers.map((_, index) => index)
      }

      if (room.phase === 'survey-faceoff') {
        room.surveyFaceoffGuesses.push({
          teamId: activeTeam.id,
          playerId: player.id,
          playerName: player.name,
          answerIndex: matchedIndex,
        })

        const awardControlChoice = (winnerGuess) => {
          room.surveyActiveTeamId = winnerGuess.teamId
          room.surveyActivePlayerId = winnerGuess.playerId
          room.surveyControlChooserPlayerId = winnerGuess.playerId
          room.phase = 'survey-control'
        }

        if (matchedIndex === 0) {
          awardControlChoice(room.surveyFaceoffGuesses.at(-1))
        } else if (room.surveyFaceoffGuesses.length === 1) {
          room.surveyActiveTeamId = otherTeam.id
          room.surveyActivePlayerId = surveyFaceoffPlayer(
            room,
            otherTeam,
            room.surveyFaceoffPairIndex,
          )
        } else {
          const [firstGuess, secondGuess] = room.surveyFaceoffGuesses
          const firstRank = firstGuess.answerIndex < 0 ? Number.POSITIVE_INFINITY : firstGuess.answerIndex
          const secondRank =
            secondGuess.answerIndex < 0 ? Number.POSITIVE_INFINITY : secondGuess.answerIndex

          if (!Number.isFinite(firstRank) && !Number.isFinite(secondRank)) {
            room.surveyFaceoffPairIndex += 1
            room.surveyFaceoffGuesses = []
            const nextStartingTeam =
              room.surveyTeams[room.questionIndex % room.surveyTeams.length]
            room.surveyActiveTeamId = nextStartingTeam.id
            room.surveyActivePlayerId = surveyFaceoffPlayer(room, nextStartingTeam)
          } else {
            awardControlChoice(firstRank <= secondRank ? firstGuess : secondGuess)
          }
        }
      } else if (room.phase === 'survey-steal') {
        finishRound(isMatch ? activeTeam : otherTeam)
      } else if (room.surveyRevealedAnswerIds.length === question.answers.length) {
        finishRound(activeTeam)
      } else {
        if (!isMatch) room.surveyStrikes += 1
        if (room.surveyStrikes >= 3) {
          room.phase = 'survey-steal'
          room.surveyActiveTeamId = otherTeam.id
          room.surveyActivePlayerId = otherTeam.playerIds[0]
        } else {
          const playerIndex = activeTeam.playerIds.indexOf(player.id)
          room.surveyActivePlayerId =
            activeTeam.playerIds[(playerIndex + 1) % activeTeam.playerIds.length]
        }
      }

      callback?.({ ok: true, matched: isMatch })
      broadcast(room)
    })

    socket.on('player:survey-control', ({ code, choice } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (room.gameType !== 'survey-showdown' || room.phase !== 'survey-control') {
        return replyError(callback, 'The play or pass decision is closed.')
      }
      if (player.id !== room.surveyControlChooserPlayerId) {
        return replyError(callback, 'The face-off winner must choose.')
      }
      if (!['play', 'pass'].includes(choice)) {
        return replyError(callback, 'Choose to play or pass.')
      }

      const winningTeam = room.surveyTeams.find((team) => team.id === player.teamId)
      const otherTeam = room.surveyTeams.find((team) => team.id !== player.teamId)
      const controllingTeam = choice === 'play' ? winningTeam : otherTeam
      const controllingFaceoffGuess = room.surveyFaceoffGuesses.find(
        (guess) => guess.teamId === controllingTeam.id,
      )

      room.surveyActiveTeamId = controllingTeam.id
      room.surveyActivePlayerId = nextSurveyTeamPlayer(
        controllingTeam,
        controllingFaceoffGuess?.playerId || controllingTeam.playerIds.at(-1),
      )
      room.surveyControlChooserPlayerId = null
      room.surveyStrikes = 0
      room.surveyLastGuess = null
      room.phase = 'survey-playing'
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:answer', ({ code, answer } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
      if (room.phase !== 'answering') return replyError(callback, 'Answers are closed.')
      if (room.gameType === 'million-ladder') {
        const canAnswer =
          (player.ladderRole === 'contestant' && !room.ladderAudienceVotingOpen) ||
          (player.ladderRole === 'audience' && room.ladderAudienceVotingOpen)
        if (!canAnswer) {
          return replyError(
            callback,
            player.ladderRole === 'contestant'
              ? 'Wait for the audience vote.'
              : 'The contestant is answering this question.',
          )
        }
      }
      if (!player.active) return replyError(callback, 'You are spectating this round.')
      if (player.hasAnswered) return replyError(callback, 'Your answer is already locked.')
      if (!String(answer || '').trim()) {
        return replyError(callback, 'Choose or enter an answer.')
      }

      player.answer = String(answer).trim().slice(0, 120)
      player.hasAnswered = true
      if (room.gameType === 'million-ladder') {
        if (player.ladderRole === 'contestant') {
          clearQuestionTimer(room)
          room.ladderTimerRemainingMs = null
        } else {
          finishAudienceVoteIfReady(room)
        }
      }
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:catchphrase-buzz', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
      if (!room || !player) return replyError(callback, 'You are not in this room.')
      if (closeExpiredQuestion(room)) return replyError(callback, 'Time is up.')
      if (room.gameType !== 'say-what-you-see' || room.phase !== 'answering') {
        return replyError(callback, 'Buzzers are closed.')
      }
      if (player.buzzedOut) return replyError(callback, 'You have already guessed this one.')

      room.catchphraseBuzzerPlayerId = player.id
      room.catchphraseTimerRemainingMs = pauseQuestionTimer(room)
      room.phase = 'catchphrase-guessing'
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:catchphrase-guess', ({ code, answer } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = room?.players.find((item) => item.socketId === socket.id)
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
      room.catchphraseLastGuess = { playerName: player.name, answer: cleanAnswer, isCorrect }
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

    socket.on('host:ladder-lifeline', ({ code, lifeline } = {}, callback) => {
      const room = getRoom(rooms, code)
      const question = room?.questions[room.questionIndex]
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can use a lifeline.')
      }
      if (room.gameType !== 'million-ladder' || room.phase !== 'answering') {
        return replyError(callback, 'Lifelines are only available during a ladder question.')
      }
      if (
        room.players.find((player) => player.ladderRole === 'contestant')?.hasAnswered
      ) {
        return replyError(callback, 'The contestant has already locked in an answer.')
      }
      const audienceCount = room.players.filter(
        (player) => player.ladderRole === 'audience' && player.connected,
      ).length
      const availableLifelines = audienceCount
        ? ['fiftyFifty', 'askRoom', 'skipQuestion']
        : ['fiftyFifty', 'switchQuestion', 'skipQuestion']
      if (!availableLifelines.includes(lifeline)) {
        return replyError(callback, 'Choose an available lifeline.')
      }
      const storedLifeline = lifeline === 'switchQuestion' ? 'askRoom' : lifeline
      if (room.ladderLifelines[storedLifeline]) {
        return replyError(callback, 'That lifeline has already been used.')
      }

      room.ladderLifelines[storedLifeline] = true
      if (lifeline === 'fiftyFifty') {
        room.ladderHiddenOptions = question.options
          .filter((option) => option !== question.answer)
          .sort(() => Math.random() - 0.5)
          .slice(0, 2)
      }
      if (lifeline === 'askRoom') {
        room.ladderPollActive = true
        room.ladderAudienceVotingOpen = true
        room.ladderTimerRemainingMs = pauseQuestionTimer(room)
        room.players
          .filter((player) => player.ladderRole === 'audience')
          .forEach(resetPlayerForNextQuestion)
      }
      if (lifeline === 'switchQuestion') {
        room.questions[room.questionIndex] = selectMillionLadderReplacement(
          room.questionIndex,
          room.usedQuestionIds,
          question.id,
        )
        room.ladderHiddenOptions = []
        room.players.forEach(resetPlayerForNextQuestion)
        startRoomQuestionTimer(room)
      }
      if (lifeline === 'skipQuestion') {
        clearQuestionTimer(room)
        room.ladderResult = { won: true, skipped: true }
        room.ladderReached = room.questionIndex
        room.phase = 'revealed'
      }
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
      } else if (room.gameType === 'say-what-you-see') {
        if (!['answering', 'catchphrase-guessing'].includes(room.phase)) {
          return replyError(callback, 'There is nothing to reveal.')
        }
        revealQuestion(room)
      } else {
        if (room.phase !== 'answering') {
          return replyError(callback, 'There is nothing to reveal.')
        }
        if (
          room.gameType === 'million-ladder' &&
          !room.players.find((player) => player.ladderRole === 'contestant')?.hasAnswered
        ) {
          return replyError(callback, 'Wait for the contestant to lock in an answer.')
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
      if (room.gameType === 'million-ladder' && !room.ladderResult?.won) {
        room.phase = 'finished'
        room.finishReason = 'ladder-missed'
      } else if (room.questionIndex >= room.questions.length - 1) {
        room.phase = 'finished'
        room.finishReason = 'completed'
      } else {
        room.questionIndex += 1
        room.players.forEach(resetPlayerForNextQuestion)
        room.roundResults = []
        room.majorityAnswers = []
        room.bluffOptions = []
        room.catchphraseBuzzerPlayerId = null
        room.catchphraseTimerRemainingMs = null
        room.catchphraseLastGuess = null
        room.ladderResult = null
        room.ladderHiddenOptions = []
        room.ladderPollActive = false
        room.ladderAudienceVotingOpen = false
        room.ladderTimerRemainingMs = null
        room.surveyRevealedAnswerIds = []
        room.surveyStrikes = 0
        room.surveyRoundBank = 0
        room.surveyRoundWinnerTeamId = null
        room.surveyLastGuess = null
        room.surveyFaceoffPairIndex = 0
        room.surveyFaceoffGuesses = []
        room.surveyControlChooserPlayerId = null
        if (room.gameType === 'survey-showdown') {
          startSurveyFaceoff(room)
        }
        room.phase =
          room.gameType === 'bluff-battle'
            ? 'bluffing'
            : room.gameType === 'survey-showdown'
              ? 'survey-faceoff'
              : 'answering'
        if (room.gameType !== 'survey-showdown') startRoomQuestionTimer(room)
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

    socket.on('host:close-room', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can close this room.')
      }
      callback?.({ ok: true })
      closeRoom({ io, rooms, room, clearQuestionTimer })
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
        player.buzzedOut = false
      })
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on(
      'host:select-game',
      ({ code, gameType, lifelineCount, lifelinesAnytime, diceMode, roundCount } = {}, callback) => {
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
          { lifelineCount, lifelinesAnytime, diceMode, roundCount },
          clearQuestionTimer,
        )
        callback?.({ ok: true })
        broadcast(room)
      },
    )

    socket.on('disconnect', () => {
      for (const [code, room] of rooms) {
        if (room.hostSocketId === socket.id) {
          room.socketIds.delete(socket.id)
          room.hostSocketId = null
          if (!room.hostReconnectTimer) {
            room.hostReconnectTimer = setTimeout(() => {
              const latestRoom = rooms.get(code)
              if (!latestRoom || latestRoom.hostSocketId) return
              closeRoom({ io, rooms, room: latestRoom, clearQuestionTimer })
            }, hostReconnectGraceMs)
          }
          broadcast(room)
          continue
        }
        const player = room.players.find((item) => item.socketId === socket.id)
        if (player) {
          player.connected = false
          room.socketIds.delete(socket.id)
          finishAudienceVoteIfReady(room)
          broadcast(room)
        }
      }
    })
  })
}
