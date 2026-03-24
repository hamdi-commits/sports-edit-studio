import axios from 'axios'

export default async function searchRoute(app) {
  app.get('/api/search-images', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1, maxLength: 100 },
          num: { type: 'integer', minimum: 1, maximum: 20, default: 12 },
        },
      },
    },
  }, async (req, reply) => {
    const { q, num = 12 } = req.query

    const hasSerpApiKey = !!process.env.SERPAPI_KEY
    console.log('[search] env check — SERPAPI_KEY loaded:', hasSerpApiKey)

    if (!hasSerpApiKey) {
      console.log('[search] Missing SERPAPI_KEY, returning mock images')
      return reply.send({ images: getMockImages(q) })
    }

    const apiParams = {
      engine: 'google_images',
      q: `${q} sports action`,
      api_key: process.env.SERPAPI_KEY,
      num,
    }
    console.log('[search] Calling SerpApi Google Images — q:', apiParams.q, '| num:', num)

    try {
      const { data } = await axios.get('https://serpapi.com/search.json', {
        params: apiParams,
        timeout: 10000,
      })

      const results = data.images_results || []
      console.log('[search] SerpApi response — items returned:', results.length)

      const images = results.slice(0, num).map((item) => ({
        url: item.original,
        thumbnail: item.thumbnail,
        title: item.title,
        width: item.original_width,
        height: item.original_height,
      }))

      return reply.send({ images })
    } catch (err) {
      console.log('[search] API error — status:', err.response?.status, '| message:', err.message, '| body:', JSON.stringify(err.response?.data))
      app.log.error(err, 'SerpApi search failed')
      return reply.status(502).send({ error: 'Image search failed', detail: err.message })
    }
  })
}

function getMockImages(q) {
  const colors = ['7c3aed', 'ec4899', 'fbbf24', '06b6d4', '10b981']
  return Array.from({ length: 12 }, (_, i) => ({
    url: `https://placehold.co/400x400/${colors[i % colors.length]}/white.png?text=${encodeURIComponent(q)}+${i + 1}`,
    thumbnail: `https://placehold.co/200x200/${colors[i % colors.length]}/white.png?text=${encodeURIComponent(q)}+${i + 1}`,
    title: `${q} photo ${i + 1}`,
  }))
}
