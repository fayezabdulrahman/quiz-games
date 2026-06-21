import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { corsOrigin, gameTypes, questionDurationMs } from './config.js'
import { createPublicState } from './game/publicState.js'
import { createRoundController } from './game/rounds.js'
import { registerSocketHandlers } from './socket/registerHandlers.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: true },
})
const rooms = new Map()

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

function broadcast(room) {
  for (const socketId of room.socketIds) {
    io.to(socketId).emit('room:state', createPublicState(room, socketId, questionDurationMs))
  }
}

const roundController = createRoundController({ broadcast, questionDurationMs })
registerSocketHandlers({ io, rooms, gameTypes, broadcast, roundController })

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, rooms: rooms.size })
})

if (process.env.NODE_ENV === 'production') {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(dirname, '../dist')
  app.use(express.static(dist))
  app.get('/{*splat}', (_request, response) => response.sendFile(path.join(dist, 'index.html')))
}

const port = Number(process.env.PORT || 3001)
server.listen(port, '0.0.0.0', () => {
  console.log(`Quiz server listening on http://localhost:${port}`)
})
