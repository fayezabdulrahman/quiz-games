import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || undefined

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
})
