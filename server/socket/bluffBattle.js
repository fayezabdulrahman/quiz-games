import { normalize } from '../game/helpers.js'
import { getRoom, getSocketPlayer, replyError } from './utils.js'

export function registerBluffBattleHandlers({ socket, rooms, broadcast }) {
  socket.on('player:bluff', ({ code, bluff } = {}, callback) => {
    const room = getRoom(rooms, code)
    const player = getSocketPlayer(room, socket)
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
    const player = getSocketPlayer(room, socket)
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
}
