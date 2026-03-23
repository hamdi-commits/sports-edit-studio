import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const QUEUE_KEY = 'queue:render:pending'

/**
 * Build a job object compatible with the BullMQ-style API used in renderWorker
 * and render.js. `stored` is a plain object that is mutated on updateProgress
 * so synchronous getters stay in sync within the same process.
 */
export function makeJob(id, data, stored = {}) {
  return {
    id,
    data,
    get progress() { return Number(stored.progress ?? 0) },
    get returnvalue() {
      if (!stored.returnvalue) return null
      if (typeof stored.returnvalue !== 'string') return stored.returnvalue
      try { return JSON.parse(stored.returnvalue) } catch { return null }
    },
    get failedReason() { return stored.failedReason || null },
    async getState() { return stored.status || 'unknown' },
    async updateProgress(n) {
      stored.progress = n
      await redis.hset(`job:${id}`, { progress: n })
    },
  }
}

export const renderQueue = {
  async add(_name, data, _opts = {}) {
    const id = uuidv4()
    await redis.hset(`job:${id}`, {
      data: JSON.stringify(data),
      status: 'waiting',
      progress: 0,
      createdAt: Date.now(),
    })
    await redis.rpush(QUEUE_KEY, id)
    return { id }
  },

  async getJob(jobId) {
    const stored = await redis.hgetall(`job:${jobId}`)
    if (!stored || !stored.data) return null
    let data
    try { data = typeof stored.data === 'string' ? JSON.parse(stored.data) : (stored.data ?? {}) } catch { data = {} }
    return makeJob(jobId, data, stored)
  },
}
