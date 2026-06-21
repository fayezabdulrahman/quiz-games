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
      ? { submittedAnswer: player.passedCurrentQuestion ? 'PASS' : player.answer }
      : {}),
  }
}

function bluffOptionsFor(room) {
  if (
    room.gameType !== 'bluff-battle' ||
    (room.phase !== 'voting' && room.phase !== 'revealed')
  ) {
    return []
  }

  return room.bluffOptions.map((option) => ({
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
}

function publicQuestion(room, question) {
  if (!question) return null
  const revealAnswer =
    room.phase === 'revealed' ||
    (room.phase === 'finished' && room.finishReason === 'all-eliminated')

  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    detail: question.detail,
    options: question.options,
    ...(revealAnswer
      ? {
          answer: Array.isArray(question.answer) ? question.answer[0] : question.answer,
          explanation: question.explanation,
        }
      : {}),
    ...(room.gameType === 'majority-rules' && room.phase === 'revealed'
      ? { results: room.roundResults, majorityAnswers: room.majorityAnswers }
      : {}),
  }
}

export function createPublicState(room, socketId, questionDurationMs) {
  const question = room.questions[room.questionIndex]
  const me = room.players.find((player) => player.socketId === socketId)
  const revealResponses =
    room.phase === 'revealed' ||
    (room.phase === 'finished' && room.finishReason === 'all-eliminated')
  const isMajorityRules = room.gameType === 'majority-rules'
  const isBluffBattle = room.gameType === 'bluff-battle'
  const isScoreGame = isMajorityRules || isBluffBattle
  const topScore = Math.max(0, ...room.players.map((player) => player.score || 0))

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
    bluffOptions: bluffOptionsFor(room),
    ownBluffOptionId:
      isBluffBattle && me
        ? room.bluffOptions.find((option) => option.authorPlayerId === me.id)?.id || null
        : null,
    selectedVoteOptionId: isBluffBattle && me ? me.voteOptionId : null,
    question: publicQuestion(room, question),
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
