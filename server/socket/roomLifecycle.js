import {
  createSurveyTeams,
  questionsForGame,
  resetPlayer,
  settingsForGame,
} from '../game/helpers.js'
import { createQuickfireTeams } from './quickfire30.js'
import { createEmptySurveyTeams } from './surveyShowdown.js'
import { clearCatchphraseGuessTimer } from './catchphrase.js'

export function closeRoom({ io, rooms, room, clearQuestionTimer }) {
  if (room.hostReconnectTimer) {
    clearTimeout(room.hostReconnectTimer)
    room.hostReconnectTimer = null
  }
  clearQuestionTimer(room)
  clearCatchphraseGuessTimer(room)
  io.to(room.code).emit('room:closed')
  rooms.delete(room.code)
}

export function buildRoom({
  code,
  gameType,
  hostSocketId,
  hostSessionToken,
  settings,
  usedQuestionIds,
}) {
  return {
    code,
    gameType,
    hostSocketId,
    hostSessionToken,
    hostReconnectTimer: null,
    socketIds: new Set([hostSocketId]),
    players: [],
    phase: 'lobby',
    finishReason: null,
    questionIndex: -1,
    questionEndsAt: null,
    questionTimer: null,
    questions: questionsForGame(gameType, usedQuestionIds, settings),
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
    surveyTeams: gameType === 'survey-showdown' ? createEmptySurveyTeams() : [],
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
    catchphraseGuessTimer: null,
    catchphraseGuessEndsAt: null,
    catchphraseLastGuess: null,
    catchphraseGuesses: [],
    settings,
  }
}

export function prepareRoomGame(room, gameType, settings, clearQuestionTimer) {
  clearQuestionTimer(room)
  clearCatchphraseGuessTimer(room)
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
  room.catchphraseGuesses = []
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
