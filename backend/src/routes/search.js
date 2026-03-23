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

    const hasApiKey = !!process.env.GOOGLE_API_KEY
    const hasCseId = !!process.env.GOOGLE_CSE_ID
    console.log('[search] env check — GOOGLE_API_KEY loaded:', hasApiKey, '| GOOGLE_CSE_ID loaded:', hasCseId)

    if (!hasApiKey || !hasCseId) {
      console.log('[search] Missing env vars, returning mock images')
      // Return mock data for local dev without API keys
      return reply.send({ images: getMockImages(q) })
    }

    const apiParams = {
      key: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CSE_ID,
      q: `${q} sports action`,
      searchType: 'image',
      num,
      safe: 'active',
      imgType: 'photo',
      imgSize: 'large',
    }
    const apiUrl = `https://www.googleapis.com/customsearch/v1?${new URLSearchParams({ ...apiParams, key: '[REDACTED]', cx: '[REDACTED]' }).toString()}`
    console.log('[search] Calling Google CSE API:', apiUrl)

    try {
      const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: apiParams,
        timeout: 10000,
      })

      console.log('[search] API response — totalResults:', data.searchInformation?.totalResults, '| items returned:', data.items?.length ?? 0)

      const images = (data.items || []).map((item) => ({
        url: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        title: item.title,
        width: item.image?.width,
        height: item.image?.height,
      }))

      return reply.send({ images })
    } catch (err) {
      console.log('[search] API error — status:', err.response?.status, '| message:', err.message, '| body:', JSON.stringify(err.response?.data))
      app.log.error(err, 'Google Search failed')
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
