import { correctAnswer } from './helpers.js'

export function createRoundController({ broadcast, questionDurationMs }) {
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

    if (room.gameType === 'million-ladder') {
      const contestant = room.players.find((player) => player.ladderRole === 'contestant')
      room.players.forEach((player) => {
        player.isCorrect =
          player.ladderRole === 'contestant'
            ? player.hasAnswered && correctAnswer(question, player.answer)
            : null
      })
      room.ladderResult = {
        won: Boolean(contestant?.isCorrect),
      }
      if (room.ladderResult.won) {
        room.ladderReached = room.questionIndex
      }
      room.phase = 'revealed'
      return true
    }

    room.players.forEach((player) => {
      if (!player.active) return
      player.isCorrect =
        player.passedCurrentQuestion ||
        (player.hasAnswered && correctAnswer(question, player.answer))
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
    room.bluffOptions = [
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
    ].sort(() => Math.random() - 0.5)
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

  function scheduleQuestionTimer(room, expectedPhase, durationMs) {
    const questionIndex = room.questionIndex
    room.questionEndsAt = Date.now() + durationMs
    room.questionTimer = setTimeout(() => {
      if (room.phase !== expectedPhase || room.questionIndex !== questionIndex) return
      if (room.gameType === 'bluff-battle') {
        if (expectedPhase === 'bluffing') openBluffVoting(room)
        else revealBluffRound(room)
      } else {
        revealQuestion(room)
      }
      broadcast(room)
    }, durationMs)
  }

  function startQuestionTimer(room, expectedPhase = 'answering') {
    clearQuestionTimer(room)
    scheduleQuestionTimer(room, expectedPhase, questionDurationMs)
  }

  function pauseQuestionTimer(room) {
    if (!room.questionEndsAt) return 0
    const remainingMs = Math.max(0, room.questionEndsAt - Date.now())
    clearQuestionTimer(room)
    return remainingMs
  }

  function resumeQuestionTimer(room, durationMs, expectedPhase = 'answering') {
    clearQuestionTimer(room)
    if (durationMs > 0) scheduleQuestionTimer(room, expectedPhase, durationMs)
  }

  function extendQuestionTimer(room, extraMs) {
    if (room.phase !== 'answering') return false
    const remainingMs = Math.max(0, room.questionEndsAt - Date.now())
    clearQuestionTimer(room)
    scheduleQuestionTimer(room, 'answering', remainingMs + extraMs)
    return true
  }

  function closeExpiredQuestion(room) {
    if (room.phase === 'answering' && room.questionEndsAt && Date.now() >= room.questionEndsAt) {
      revealQuestion(room)
      broadcast(room)
      return true
    }
    return false
  }

  return {
    clearQuestionTimer,
    closeExpiredQuestion,
    openBluffVoting,
    revealBluffRound,
    revealQuestion,
    startQuestionTimer,
    pauseQuestionTimer,
    resumeQuestionTimer,
    extendQuestionTimer,
  }
}
