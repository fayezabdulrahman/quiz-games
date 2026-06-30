import { resetPlayerForNextQuestion } from '../game/helpers.js'
import { selectMillionLadderReplacementQuestion } from '../db/questions/selector.js'
import { getRoom, replyError } from './utils.js'

export function finishAudienceVoteIfReady(room, resumeQuestionTimer) {
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

export function registerMillionLadderHandlers({
  socket,
  rooms,
  broadcast,
  clearQuestionTimer,
  pauseQuestionTimer,
  startRoomQuestionTimer,
}) {
  socket.on('host:ladder-lifeline', async ({ code, lifeline } = {}, callback) => {
    const room = getRoom(rooms, code)
    const question = room?.questions[room.questionIndex]
    if (!room || room.hostSocketId !== socket.id) {
      return replyError(callback, 'Only the host can use a lifeline.')
    }
    if (room.gameType !== 'million-ladder' || room.phase !== 'answering') {
      return replyError(callback, 'Lifelines are only available during a ladder question.')
    }
    if (room.players.find((player) => player.ladderRole === 'contestant')?.hasAnswered) {
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
      try {
        room.questions[room.questionIndex] = await selectMillionLadderReplacementQuestion(
          room.questionIndex,
          room.usedQuestionIds,
          question.id,
        )
      } catch (error) {
        console.error('Failed to switch Million Ladder question', error)
        return replyError(callback, 'Could not load a replacement question.')
      }
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
}
