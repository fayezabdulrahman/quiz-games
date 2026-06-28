const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export const hostReconnectGraceMs = 15 * 60 * 1000

export function replyError(callback, message) {
  callback?.({ ok: false, error: message })
}

export function makeCode(rooms) {
  let code = ''
  do {
    code = Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('')
  } while (rooms.has(code))
  return code
}

export function getRoom(rooms, code) {
  return rooms.get(String(code || '').trim().toUpperCase())
}

export function cleanSessionToken(value = '') {
  return String(value || '').trim().slice(0, 80)
}

export function getSocketPlayer(room, socket) {
  return room?.players.find((player) => player.socketId === socket.id)
}

export function setHostSocket(room, socket) {
  if (room.hostReconnectTimer) {
    clearTimeout(room.hostReconnectTimer)
    room.hostReconnectTimer = null
  }
  room.hostSocketId = socket.id
  room.socketIds.add(socket.id)
  socket.join(room.code)
}

export function setPlayerSocket(room, player, socket) {
  if (player.socketId && player.socketId !== socket.id) {
    room.socketIds.delete(player.socketId)
  }
  player.socketId = socket.id
  player.connected = true
  room.socketIds.add(socket.id)
  socket.join(room.code)
}
