import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function hashtagsRoute(app) {
  app.post('/api/hashtags', {
    schema: {
      body: {
        type: 'object',
        required: ['athleteName'],
        properties: {
          athleteName: { type: 'string', minLength: 1 },
          sport:       { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { athleteName, sport = '' } = req.body

    const prompt = `Generate exactly 10 YouTube hashtags for a sports edit video.
Athlete: ${athleteName}
Sport: ${sport || 'Unknown sport'}

Requirements:
- 3 athlete-specific tags (name variations, nickname)
- 3 sport-specific tags (the sport itself, key terms)
- 2 edit/video style tags (e.g. #SportsEdit #Highlights)
- 2 platform growth tags (e.g. #YouTube #Shorts)
- Use only English
- No spaces in hashtags (use CamelCase for multi-word)
- Do NOT mix sports (if football, only football tags)
- Return ONLY the 10 hashtags, one per line, each starting with #
- No explanations, no numbering`

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = message.content[0]?.text?.trim() || ''
      // Parse hashtags — accept lines starting with # or plain words we prefix
      const tags = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => (l.startsWith('#') ? l : `#${l}`))
        .slice(0, 10)

      return reply.send({ hashtags: tags })
    } catch (err) {
      app.log.error(err)
      // Graceful fallback — generic tags so the UI never breaks
      const safeName = athleteName.replace(/\s+/g, '')
      return reply.send({
        hashtags: [
          `#${safeName}`,
          '#SportsEdit',
          '#Highlights',
          '#Football',
          '#Sports',
          '#Edit',
          '#Shorts',
          '#YouTube',
          '#ViralVideo',
          '#Goals',
        ],
      })
    }
  })
}
