import {
  createPlayer,
  createSurveyTeams,
  normalize,
  questionsForGame,
  resetPlayer,
  resetPlayerForNextQuestion,
  settingsForGame,
} from '../game/helpers.js'
import { selectMillionLadderReplacement } from '../questions/millionLadder/index.js'

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
  room.ladderReached = -1
  room.ladderResult = null
  room.ladderHiddenOptions = []
  room.ladderLifelines = { fiftyFifty: false, askRoom: false, skipQuestion: false }
  room.ladderPollActive = false
  room.ladderAudienceVotingOpen = false
  room.ladderTimerRemainingMs = null
  room.surveyTeams = []
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
    socket.on(
      'host:create',
      ({ gameType, lifelineCount, lifelinesAnytime } = {}, callback) => {
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
          ladderReached: -1,
          ladderResult: null,
          ladderHiddenOptions: [],
          ladderLifelines: { fiftyFifty: false, askRoom: false, skipQuestion: false },
          ladderPollActive: false,
          ladderAudienceVotingOpen: false,
          ladderTimerRemainingMs: null,
          surveyTeams: [],
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

      const player = createPlayer(socket.id, cleanName, room.settings)
      if (room.gameType === 'million-ladder') {
        player.ladderRole = room.players.some((item) => item.ladderRole === 'contestant')
          ? 'audience'
          : 'contestant'
      }
      room.players.push(player)
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
      const minimumPlayers =
        room.gameType === 'bluff-battle' || room.gameType === 'survey-showdown' ? 2 : 1
      if (room.players.length < minimumPlayers) {
        return replyError(
          callback,
          room.gameType === 'bluff-battle' || room.gameType === 'survey-showdown'
            ? `${room.gameType === 'bluff-battle' ? 'Bluff Battle' : 'Survey Showdown'} needs at least two players.`
            : 'At least one player must join.',
        )
      }

      room.questionIndex = 0
      room.players.forEach((player) => {
        resetPlayer(player, room.settings, true)
      })
      if (room.gameType === 'survey-showdown') {
        room.surveyTeams = createSurveyTeams(room.players)
        startSurveyFaceoff(room)
      } else {
        room.phase = room.gameType === 'bluff-battle' ? 'bluffing' : 'answering'
      }
      room.finishReason = null
      room.bluffOptions = []
      if (room.gameType !== 'survey-showdown') startRoomQuestionTimer(room)
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
          finishAudienceVoteIfReady(room)
          broadcast(room)
        }
      }
    })
  })
}
