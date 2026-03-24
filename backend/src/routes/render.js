import { renderQueue } from '../lib/queue.js'

const jobMap = new Map()

export default async function renderRoute(app) {
  // POST /api/render — submit a new render job
  // Accepts both legacy format (photos: string[], effect: string) and
  // new per-photo format (photos: {url, effect, duration}[])
  app.post('/api/render', {
    schema: {
      body: {
        type: 'object',
        required: ['photos', 'music'],
        additionalProperties: true,
        properties: {
          photos: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: {},   // Accept both strings and objects — validated in handler
          },
          effect:   { type: 'string' },   // optional global fallback (legacy)
          music:    { type: 'string' },
          musicUrl: { type: 'string' },  // CDN URL — downloaded by worker
        },
      },
    },
  }, async (req, reply) => {
    const { photos, effect, music, musicUrl } = req.body

    const job = await renderQueue.add('render', { photos, effect, music, musicUrl }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    })

    jobMap.set(job.id, { status: 'pending', progress: 0 })

    return reply.status(202).send({ jobId: job.id })
  })

  // GET /api/render/:jobId — poll job status
  app.get('/api/render/:jobId', {
    schema: {
      params: {
        type: 'object',
        required: ['jobId'],
        properties: { jobId: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const { jobId } = req.params

    try {
      const job = await renderQueue.getJob(jobId)
      if (!job) return reply.status(404).send({ error: 'Job not found' })

      const state = await job.getState()
      const progress = typeof job.progress === 'number' ? job.progress : 0

      const response = { jobId, status: state, progress }

      if (state === 'completed' && job.returnvalue?.videoUrl) {
        response.videoUrl = job.returnvalue.videoUrl
      }
      if (state === 'failed') {
        response.error = job.failedReason
      }

      return reply.send(response)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Could not get job status' })
    }
  })
}
