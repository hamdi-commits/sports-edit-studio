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

    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      // Return mock data for local dev without API keys
      return reply.send({ images: getMockImages(q) })
    }

    try {
      const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_API_KEY,
          cx: process.env.GOOGLE_CSE_ID,
          q: `${q} sports action`,
          searchType: 'image',
          num,
          safe: 'active',
          imgType: 'action',
          imgSize: 'large',
        },
        timeout: 10000,
      })

      const images = (data.items || []).map((item) => ({
        url: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        title: item.title,
        width: item.image?.width,
        height: item.image?.height,
      }))

      return reply.send({ images })
    } catch (err) {
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
