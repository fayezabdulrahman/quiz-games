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
    teamId: player.teamId || null,
    ladderRole: player.ladderRole || null,
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
          voterNames: room.players
            .filter((player) => player.voteOptionId === option.id)
            .map((player) => player.name),
        }
      : {}),
  }))
}

function publicQuestion(room, question, socketId) {
  if (!question) return null
  if (room.gameType === 'quickfire-30') {
    const player = room.players.find((item) => item.socketId === socketId)
    const canSeeTerms =
      ['quickfire-scoring', 'quickfire-result', 'finished'].includes(room.phase) ||
      (room.phase === 'quickfire-describing' && player?.id === room.quickfireActivePlayerId)
    return {
      id: question.id,
      terms: canSeeTerms ? question.terms : [],
    }
  }
  const revealAnswer =
    room.phase === 'revealed' ||
    (room.phase === 'finished' &&
      ['all-eliminated', 'ladder-missed', 'completed', 'host-ended'].includes(room.finishReason))

  const ladderPoll =
    room.gameType === 'million-ladder' && room.ladderPollActive
      ? question.options.map((option) => ({
          option,
          votes: room.players.filter(
            (player) => player.ladderRole === 'audience' && player.answer === option,
          ).length,
        }))
      : null

  if (room.gameType === 'survey-showdown') {
    return {
      id: question.id,
      prompt: question.prompt,
      answers: question.answers.map((answer, index) => ({
        id: index,
        revealed: room.surveyRevealedAnswerIds.includes(index),
        ...(room.surveyRevealedAnswerIds.includes(index)
          ? { text: answer.text, points: answer.points }
          : {}),
      })),
    }
  }

  return {
    id: question.id,
    type: question.type,
    inputMode: question.inputMode,
    prompt: question.prompt,
    detail: question.detail,
    options:
      room.gameType === 'million-ladder'
        ? question.options.filter((option) => !room.ladderHiddenOptions.includes(option))
        : question.options,
    ...(ladderPoll ? { poll: ladderPoll } : {}),
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
  const isMillionLadder = room.gameType === 'million-ladder'
  const isSurveyShowdown = room.gameType === 'survey-showdown'
  const isQuickfire30 = room.gameType === 'quickfire-30'
  const isScoreGame = isMajorityRules || isBluffBattle
  const topScore = Math.max(0, ...room.players.map((player) => player.score || 0))

  return {
    code: room.code,
    gameType: room.gameType,
    gameName: isMajorityRules
      ? 'Majority Rules'
      : isBluffBattle
        ? 'Bluff Battle'
        : isMillionLadder
          ? 'Million Ladder'
          : isSurveyShowdown
            ? 'Survey Showdown'
            : isQuickfire30
              ? 'Quickfire 30'
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
    question: publicQuestion(room, question, socketId),
    players: room.players.map((player) => playerView(player, revealResponses)),
    me: me ? playerView(me, revealResponses) : null,
    isHost: room.hostSocketId === socketId,
    settings: room.settings,
    finishReason: room.finishReason,
    ...(isMillionLadder
      ? {
          ladderReached: room.ladderReached,
          ladderResult: room.ladderResult,
          ladderLifelines: room.ladderLifelines,
          ladderPollActive: room.ladderPollActive,
          ladderAudienceVotingOpen: room.ladderAudienceVotingOpen,
          ladderAudienceCount: room.players.filter(
            (player) => player.ladderRole === 'audience' && player.connected,
          ).length,
          ladderContestantName:
            room.players.find((player) => player.ladderRole === 'contestant')?.name || null,
          ladderLockedAnswer:
            room.hostSocketId === socketId
              ? room.players.find(
                  (player) => player.ladderRole === 'contestant' && player.hasAnswered,
                )?.answer || null
              : null,
        }
      : {}),
    ...(isSurveyShowdown
      ? {
          surveyTeams: room.surveyTeams,
          surveyStrikes: room.surveyStrikes,
          surveyRoundBank: room.surveyRoundBank,
          surveyActiveTeamId: room.surveyActiveTeamId,
          surveyActivePlayerId: room.surveyActivePlayerId,
          surveyRoundWinnerTeamId: room.surveyRoundWinnerTeamId,
          surveyLastGuess: room.surveyLastGuess,
          surveyFaceoffGuesses: room.surveyFaceoffGuesses,
          surveyControlChooserPlayerId: room.surveyControlChooserPlayerId,
          surveyMultiplier: room.questionIndex < 3 ? 1 : room.questionIndex < 5 ? 2 : 3,
        }
      : {}),
    ...(isQuickfire30
      ? {
          quickfireTeams: room.quickfireTeams,
          quickfireActiveTeamId:
            room.quickfireTeams[room.quickfireActiveTeamIndex]?.id || null,
          quickfireActivePlayerId: room.quickfireActivePlayerId,
          quickfireDie: room.quickfireDie,
          quickfireCorrectTermIndexes: room.quickfireCorrectTermIndexes,
          quickfireLastMove: room.quickfireLastMove,
        }
      : {}),
    winnerNames:
      room.phase === 'finished'
        ? isQuickfire30
          ? room.quickfireTeams
              .filter(
                (team) =>
                  team.position === Math.max(...room.quickfireTeams.map((item) => item.position)),
              )
              .map((team) => team.name)
          : isSurveyShowdown
          ? room.surveyTeams
              .filter((team) => team.score === Math.max(...room.surveyTeams.map((item) => item.score)))
              .map((team) => team.name)
          : isScoreGame
          ? room.players
              .filter((player) => (player.score || 0) === topScore)
              .map((player) => player.name)
          : room.players.filter((player) => player.active).map((player) => player.name)
        : [],
  }
}
