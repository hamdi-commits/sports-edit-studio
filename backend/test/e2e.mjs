/**
 * End-to-end integration test (no test runner needed).
 * Usage: node test/e2e.mjs
 *
 * Tests:
 *  1. GET /health
 *  2. GET /api/search-images?q=Messi  (mock mode)
 *  3. POST /api/render                (job submission)
 *  4. GET /api/render/:id             (status poll)
 */

import http from 'http'

const BASE = `http://localhost:${process.env.PORT || 3001}`
let passed = 0
let failed = 0

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, data: body }) }
      })
    }).on('error', reject)
  })
}

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const req = http.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = ''
      res.on('data', (d) => (data += d))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`)
    passed++
  } else {
    console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`)
    failed++
  }
}

async function run() {
  console.log(`\n🔬 Sports Edit Studio — Integration Tests\n`)
  console.log(`   Target: ${BASE}\n`)

  // ── 1. Health ─────────────────────────────────────────────────────────────
  console.log('1. Health endpoint')
  const health = await get('/health')
  assert('status 200', health.status === 200)
  assert('ok:true', health.data.ok === true)

  // ── 2. Image Search (mock) ────────────────────────────────────────────────
  console.log('\n2. Image Search (mock mode)')
  const search = await get('/api/search-images?q=Ronaldo')
  assert('status 200', search.status === 200, JSON.stringify(search))
  assert('returns images array', Array.isArray(search.data?.images))
  assert('12 images returned', search.data?.images?.length === 12)
  assert('each image has url', search.data?.images?.[0]?.url?.startsWith('http'))
  assert('each image has thumbnail', typeof search.data?.images?.[0]?.thumbnail === 'string')

  // ── 3. Render job submission ───────────────────────────────────────────────
  console.log('\n3. Render Job Submission')
  const render = await post('/api/render', {
    photos: [
      'https://placehold.co/400x400/7c3aed/white?text=Test1',
      'https://placehold.co/400x400/ec4899/white?text=Test2',
      'https://placehold.co/400x400/fbbf24/white?text=Test3',
    ],
    effect: 'flash_cut',
    music: 'epic_rock',
  })
  assert('status 202', render.status === 202, `got ${render.status}`)
  assert('returns jobId', typeof render.data?.jobId === 'string')
  const jobId = render.data?.jobId

  // ── 4. Job status poll ────────────────────────────────────────────────────
  if (jobId) {
    console.log('\n4. Job Status Poll')
    const status = await get(`/api/render/${jobId}`)
    assert('status 200', status.status === 200)
    assert('has status field', ['waiting', 'active', 'pending', 'completed', 'failed'].includes(status.data?.status),
      `got: ${status.data?.status}`)
    assert('has progress field', typeof status.data?.progress === 'number')
    assert('has jobId field', status.data?.jobId === jobId)

    // ── 5. Unknown job ID ──────────────────────────────────────────────────
    console.log('\n5. Unknown Job ID')
    const missing = await get('/api/render/nonexistent-job-id-9999')
    assert('status 404', missing.status === 404)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Results: ${passed}/${total} passed${failed > 0 ? ` (${failed} FAILED)` : ' 🎉'}`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('\n💥 Test runner error:', err.message)
  process.exit(1)
})
