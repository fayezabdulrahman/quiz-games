import crypto from 'node:crypto'
import {
  createPlayer,
  resetPlayer,
  resetPlayerForNextQuestion,
  settingsForGame,
} from '../game/helpers.js'
import { registerBluffBattleHandlers } from './bluffBattle.js'
import { clearCatchphraseGuessTimer, registerCatchphraseHandlers } from './catchphrase.js'
import { finishAudienceVoteIfReady, registerMillionLadderHandlers } from './millionLadder.js'
import {
  registerQuickfireHandlers,
  startQuickfireTurn,
  syncQuickfireTeamPlayers,
} from './quickfire30.js'
import { buildRoom, closeRoom, prepareRoomGame } from './roomLifecycle.js'
import {
  assignSurveyPlayerToSmallestTeam,
  registerSurveyShowdownHandlers,
  startSurveyFaceoff,
  syncSurveyTeamPlayers,
} from './surveyShowdown.js'
import {
  cleanSessionToken,
  getRoom,
  getSocketPlayer,
  hostReconnectGraceMs,
  makeCode,
  replyError,
  setHostSocket,
  setPlayerSocket,
} from './utils.js'

const twoPlayerGameNames = {
  'bluff-battle': 'Bluff Battle',
  'survey-showdown': 'Survey Showdown',
  'quickfire-30': 'Quickfire 30',
}

function gameSettingsFromPayload(payload = {}) {
  const {
    lifelineCount,
    lifelinesAnytime,
    diceMode,
    roundCount,
    guessTimerEnabled,
    guessSeconds,
  } = payload
  return { lifelineCount, lifelinesAnytime, diceMode, roundCount, guessTimerEnabled, guessSeconds }
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

  function startRoomQuestionTimer(room) {
    if (room.gameType === 'million-ladder' && room.questionIndex >= 5) {
      clearQuestionTimer(room)
      return
    }
    startQuestionTimer(room, room.phase)
  }

  function resetRoundState(room) {
    room.players.forEach(resetPlayerForNextQuestion)
    room.roundResults = []
    room.majorityAnswers = []
    room.bluffOptions = []
    room.catchphraseBuzzerPlayerId = null
    room.catchphraseTimerRemainingMs = null
    clearCatchphraseGuessTimer(room)
    room.catchphraseLastGuess = null
    room.catchphraseGuesses = []
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
  }

  function registerSharedHandlers(socket) {
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
      finishAudienceVoteIfReady(room, resumeQuestionTimer)
      callback?.({ ok: true, role: 'player' })
      broadcast(room)
    })

    socket.on('host:create', (payload = {}, callback) => {
      const code = makeCode(rooms)
      const hostSessionToken = cleanSessionToken(payload.sessionToken) || crypto.randomUUID()
      const usedQuestionIds = new Set()
      const gameType = gameTypes.has(payload.gameType) ? payload.gameType : 'one-percent'
      const settings = settingsForGame(gameType, gameSettingsFromPayload(payload))
      const room = buildRoom({
        code,
        gameType,
        hostSocketId: socket.id,
        hostSessionToken,
        settings,
        usedQuestionIds,
      })
      rooms.set(code, room)
      socket.join(code)
      callback?.({ ok: true, code, sessionToken: hostSessionToken })
      broadcast(room)
    })

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
      const gameName = twoPlayerGameNames[room.gameType]
      if (room.players.length < (gameName ? 2 : 1)) {
        return replyError(
          callback,
          gameName ? `${gameName} needs at least two players.` : 'At least one player must join.',
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
          team.position = 0
        })
        room.quickfireActiveTeamIndex = 0
        room.quickfireTeamTurnCounts = { coral: 0, blue: 0 }
        startQuickfireTurn(room, clearQuestionTimer)
      } else {
        room.phase = room.gameType === 'bluff-battle' ? 'bluffing' : 'answering'
      }
      room.finishReason = null
      room.bluffOptions = []
      if (room.gameType !== 'survey-showdown') startRoomQuestionTimer(room)
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:answer', ({ code, answer } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = getSocketPlayer(room, socket)
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
          finishAudienceVoteIfReady(room, resumeQuestionTimer)
        }
      }
      callback?.({ ok: true })
      broadcast(room)
    })

    socket.on('player:pass', ({ code } = {}, callback) => {
      const room = getRoom(rooms, code)
      const player = getSocketPlayer(room, socket)
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
        clearCatchphraseGuessTimer(room)
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
        resetRoundState(room)
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
      if (['lobby', 'game-select', 'finished'].includes(room.phase)) {
        return replyError(callback, 'This game is not in progress.')
      }
      clearQuestionTimer(room)
      clearCatchphraseGuessTimer(room)
      if (room.gameType === 'million-ladder') {
        room.ladderPollActive = false
        room.ladderAudienceVotingOpen = false
        room.ladderTimerRemainingMs = null
      }
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

    socket.on('host:select-game', (payload = {}, callback) => {
      const room = getRoom(rooms, payload.code)
      if (!room || room.hostSocketId !== socket.id) {
        return replyError(callback, 'Only the host can choose the next game.')
      }
      if (room.phase !== 'game-select') {
        return replyError(callback, 'The game picker is not open.')
      }
      if (!gameTypes.has(payload.gameType)) return replyError(callback, 'Choose an available game.')
      prepareRoomGame(room, payload.gameType, gameSettingsFromPayload(payload), clearQuestionTimer)
      callback?.({ ok: true })
      broadcast(room)
    })

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
        const player = getSocketPlayer(room, socket)
        if (player) {
          player.connected = false
          room.socketIds.delete(socket.id)
          finishAudienceVoteIfReady(room, resumeQuestionTimer)
          broadcast(room)
        }
      }
    })
  }

  io.on('connection', (socket) => {
    registerSharedHandlers(socket)
    registerSurveyShowdownHandlers({ socket, rooms, broadcast })
    registerQuickfireHandlers({
      socket,
      rooms,
      broadcast,
      clearQuestionTimer,
      questionDurationMs,
    })
    registerCatchphraseHandlers({
      socket,
      rooms,
      broadcast,
      closeExpiredQuestion,
      pauseQuestionTimer,
      questionDurationMs,
      resumeQuestionTimer,
      revealQuestion,
    })
    registerMillionLadderHandlers({
      socket,
      rooms,
      broadcast,
      clearQuestionTimer,
      pauseQuestionTimer,
      startRoomQuestionTimer,
    })
    registerBluffBattleHandlers({ socket, rooms, broadcast })
  })
}
