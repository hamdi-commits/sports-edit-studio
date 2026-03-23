/**
 * Combined entrypoint: runs API server + render worker in a single process.
 * Handy for Railway's free tier (one dyno).
 *
 * For separation of concerns in production, use:
 *   npm start   → API only
 *   npm run worker → Worker only
 */

// Worker must be imported first so it registers before the server starts accepting jobs
import './renderWorker.js'

// Slight delay then start API so worker Redis connection is established
await new Promise((r) => setTimeout(r, 500))
await import('../index.js')
