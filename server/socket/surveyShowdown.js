import { normalize } from '../game/helpers.js'
import { getRoom, getSocketPlayer, replyError } from './utils.js'

export function createEmptySurveyTeams() {
  return [
    { id: 'lime', name: 'Lime Team', score: 0, playerIds: [] },
    { id: 'violet', name: 'Violet Team', score: 0, playerIds: [] },
  ]
}

export function surveyFaceoffPlayer(room, team, pairIndex = room.surveyFaceoffPairIndex) {
  return team.playerIds[pairIndex % team.playerIds.length]
}

export function startSurveyFaceoff(room) {
  const startingTeam = room.surveyTeams[room.questionIndex % room.surveyTeams.length]
  room.surveyFaceoffPairIndex = 0
  room.surveyFaceoffGuesses = []
  room.surveyControlChooserPlayerId = null
  room.surveyActiveTeamId = startingTeam.id
  room.surveyActivePlayerId = surveyFaceoffPlayer(room, startingTeam)
  room.phase = 'survey-faceoff'
}

export function nextSurveyTeamPlayer(team, currentPlayerId) {
  const currentIndex = team.playerIds.indexOf(currentPlayerId)
  return team.playerIds[(Math.max(0, currentIndex) + 1) % team.playerIds.length]
}

export function syncSurveyTeamPlayers(room) {
  if (!room.surveyTeams.length) room.surveyTeams = createEmptySurveyTeams()
  room.surveyTeams.forEach((team) => {
    team.playerIds = room.players
      .filter((player) => player.teamId === team.id)
      .map((player) => player.id)
  })
}

export function assignSurveyPlayerToSmallestTeam(room, player) {
  if (!room.surveyTeams.length) room.surveyTeams = createEmptySurveyTeams()
  syncSurveyTeamPlayers(room)
  const targetTeam = [...room.surveyTeams].sort(
    (first, second) => first.playerIds.length - second.playerIds.length,
  )[0]
  player.teamId = targetTeam?.id || 'lime'
  syncSurveyTeamPlayers(room)
}

export function registerSurveyShowdownHandlers({ socket, rooms, broadcast }) {
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

  socket.on('player:survey-guess', ({ code, guess } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
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
          const nextStartingTeam = room.surveyTeams[room.questionIndex % room.surveyTeams.length]
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
    const player = getSocketPlayer(room, socket)
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
      (faceoffGuess) => faceoffGuess.teamId === controllingTeam.id,
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
}
