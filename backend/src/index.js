import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import searchRoute from './routes/search.js'
import renderRoute from './routes/render.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = Fastify({ logger: { level: 'info' } })

await app.register(cors, {
  origin: process.env.FRONTEND_URL || true,
})

// Serve rendered videos from uploads dir
await app.register(staticFiles, {
  root: join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
})

await app.register(searchRoute)
await app.register(renderRoute)

app.get('/health', async () => ({ ok: true, ts: Date.now() }))

const port = Number(process.env.PORT || 3001)
await app.listen({ port, host: '0.0.0.0' })
console.log(`🚀 Backend running on http://localhost:${port}`)
