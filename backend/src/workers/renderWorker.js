/**
 * Render Worker — processes BullMQ jobs
 *
 * Each job: download images → apply FFmpeg effect → mux with music → save MP4
 *
 * Supports per-photo effects (new format) and legacy single-effect format.
 * All clips output 1080×1920 @ 30 fps H.264/AAC.
 */

import 'dotenv/config'
import { redis, QUEUE_KEY, makeJob } from '../lib/queue.js'
import ffmpeg from 'fluent-ffmpeg'
import axios from 'axios'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { rm } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { pipeline } from 'stream/promises'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads')
const TMP_DIR     = join(__dirname, '..', '..', 'tmp')
const MUSIC_DIR   = join(__dirname, '..', '..', 'assets', 'music')
const ASSETS_DIR  = join(__dirname, '..', '..', 'assets')

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
if (!existsSync(TMP_DIR))     mkdirSync(TMP_DIR,     { recursive: true })

const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg'
if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)

// Pre-generate a 120 s silent MP3 fallback (used when no music track file exists).
// We call ffmpeg directly here to bypass fluent-ffmpeg's format capability check,
// which incorrectly rejects the 'lavfi' virtual device on some static builds.
const SILENT_AUDIO_PATH = join(ASSETS_DIR, 'silence.mp3')
if (!existsSync(SILENT_AUDIO_PATH)) {
  try {
    execSync(
      `"${ffmpegBin}" -f lavfi -i anullsrc=r=44100:cl=stereo -t 120 -c:a libmp3lame -q:a 9 "${toFfmpegPath(SILENT_AUDIO_PATH)}" -y`,
      { stdio: 'ignore' }
    )
    console.log('Generated silence.mp3 fallback audio')
  } catch (e) {
    console.warn('Could not pre-generate silent audio:', e.message)
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

// Windows path.join uses backslashes; FFmpeg (MinGW/MSYS2 builds) expects
// forward slashes. Normalize any path before handing it to FFmpeg.
const toFfmpegPath = (p) => p.replace(/\\/g, '/')

async function downloadImage(url, destPath) {
  const resp = await axios.get(url, {
    responseType: 'stream',
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  await pipeline(resp.data, createWriteStream(destPath))
}

function buildServerVideoUrl(filename) {
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`
  return `${base}/uploads/${filename}`
}

// ─── FFmpeg effect filter builders ───────────────────────────────────────────

/**
 * Build an FFmpeg filter chain for a single clip.
 * @param {number} index   - ffmpeg input index (0-based)
 * @param {string} effect  - effect id
 * @param {number} dur     - clip duration in seconds
 * @returns {string}       - filter string producing [v{index}]
 */
function buildSingleClipFilter(index, effect, dur) {
  const fps = 30
  const frames = Math.max(1, Math.round(dur * fps))
  const base = `[${index}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1`
  const loop = `loop=loop=-1:size=1:start=0,trim=duration=${dur},fps=fps=${fps}`
  const tail = `setsar=1,setpts=PTS-STARTPTS[v${index}]`

  switch (effect) {
    case 'zoom_out':
      return (
        `${base},fps=${fps},` +
        `zoompan=z='if(eq(on,1),1.3,max(zoom-0.003,1.0))':` +
        `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )

    case 'zoom_burst': {
      const burst = Math.round(fps * 0.5)
      return (
        `${base},fps=${fps},` +
        `zoompan=z='if(lte(on,${burst}),1+0.5*(on/${burst}),1.5)':` +
        `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )
    }

    case 'slide_right':
      return (
        `${base},fps=${fps},` +
        `zoompan=z='1.1':x='(iw-iw/zoom)*(1-on/${frames})':y='(ih-ih/zoom)/2':` +
        `d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )

    case 'slide_left':
      return (
        `${base},fps=${fps},` +
        `zoompan=z='1.1':x='(iw-iw/zoom)*on/${frames}':y='(ih-ih/zoom)/2':` +
        `d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )

    case 'slide_up':
      return (
        `${base},fps=${fps},` +
        `zoompan=z='1.1':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/${frames})':` +
        `d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )

    case 'pan_horizontal':
      return (
        `${base},fps=${fps},` +
        `zoompan=z='1.15':x='(iw-iw/zoom)*on/${frames}':y='(ih-ih/zoom)/2':` +
        `d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )

    case 'rotate_zoom':
      return (
        `${base},fps=${fps},` +
        `zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
        `d=${frames}:s=1080x1920:fps=${fps},` +
        `rotate=angle=0.05:fillcolor=black,` +
        `${tail}`
      )

    case 'fade': {
      const fd = Math.min(0.5, dur / 4).toFixed(3)
      const foStart = (dur - parseFloat(fd)).toFixed(3)
      return (
        `${base},${loop},` +
        `fade=t=in:st=0:d=${fd},fade=t=out:st=${foStart}:d=${fd},` +
        `${tail}`
      )
    }

    case 'glitch':
      return (
        `${base},${loop},` +
        `hue=h='if(lt(mod(t,0.15),0.07),25,-25)':s=1.8,` +
        `${tail}`
      )

    case 'color_shift':
      return (
        `${base},${loop},` +
        `hue=h='t*60':s=1.4,` +
        `${tail}`
      )

    case 'vhs':
      return (
        `${base},${loop},` +
        `unsharp=3:3:0.5:3:3:0,hue=s=0.45,eq=contrast=1.1,` +
        `${tail}`
      )

    case 'sparkle': {
      const sf = Math.min(0.4, dur / 6).toFixed(3)
      return (
        `${base},${loop},` +
        `eq=brightness=0.15:saturation=2.0,fade=t=in:st=0:d=${sf},` +
        `${tail}`
      )
    }

    case 'burn_wipe': {
      const bf = Math.min(0.4, dur / 4).toFixed(3)
      return (
        `${base},${loop},` +
        `fade=t=in:st=0:d=${bf}:color=0xff6600,` +
        `${tail}`
      )
    }

    case 'freeze_frame':
      return (
        `${base},${loop},` +
        `${tail}`
      )

    case 'flash_cut': {
      const ff = (4 / fps).toFixed(3)
      return (
        `${base},${loop},` +
        `fade=t=in:st=0:d=${ff}:color=white,` +
        `${tail}`
      )
    }

    case 'ken_burns':
    default:
      return (
        `${base},fps=${fps},` +
        `zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
        `d=${frames}:s=1080x1920:fps=${fps},` +
        `${tail}`
      )
  }
}

/**
 * Build a complete filter graph for a list of per-photo items.
 * @param {{effect: string, duration: number}[]} items - one per successfully-downloaded image
 * @returns {string} complete filtergraph string
 */
function buildPerPhotoFilterGraph(items) {
  const parts = items.map((item, i) =>
    buildSingleClipFilter(i, item.effect, item.duration)
  )
  const inputs = items.map((_, i) => `[v${i}]`).join('')
  parts.push(`${inputs}concat=n=${items.length}:v=1:a=0[outv]`)
  return parts.join(';')
}


// ─── Music ───────────────────────────────────────────────────────────────────

function getMusicPath(musicId) {
  const path = join(MUSIC_DIR, `${musicId}.mp3`)
  if (existsSync(path)) return path
  // Fall back to pre-generated silence
  if (existsSync(SILENT_AUDIO_PATH)) return SILENT_AUDIO_PATH
  return null
}

// ─── Core render ─────────────────────────────────────────────────────────────

async function renderVideo(job) {
  const { photos, effect: globalEffect, music } = job.data
  const jobTmpDir = join(TMP_DIR, job.id)
  mkdirSync(jobTmpDir, { recursive: true })

  await job.updateProgress(5)

  // Normalise photos to [{url, effect, duration}] regardless of input format
  const photoItems = photos.map((p) =>
    typeof p === 'string'
      ? { url: p, effect: globalEffect || 'ken_burns', duration: 2.5 }
      : { url: p.url || p, effect: p.effect || globalEffect || 'ken_burns', duration: p.duration || 2.5 }
  )

  // 1. Download images in parallel (max 4 at a time), skipping any that fail (e.g. 403)
  const allPaths = photoItems.map((_, i) => join(jobTmpDir, `img_${i}.jpg`))

  const CHUNK = 4
  const successItems = []
  for (let start = 0; start < photoItems.length; start += CHUNK) {
    const chunk = photoItems.slice(start, start + CHUNK)
    const results = await Promise.allSettled(
      chunk.map((item, j) => downloadImage(item.url, allPaths[start + j]))
    )
    for (let j = 0; j < chunk.length; j++) {
      if (results[j].status === 'fulfilled') {
        successItems.push({ path: allPaths[start + j], effect: chunk[j].effect, duration: chunk[j].duration })
      } else {
        const status = results[j].reason?.response?.status
        console.warn(`[render] Skipping image ${start + j} (${chunk[j].url}): ${status ?? results[j].reason?.message}`)
      }
    }
    await job.updateProgress(5 + Math.round(((start + CHUNK) / photoItems.length) * 35))
  }

  if (successItems.length === 0) throw new Error('All image downloads failed — no images to render')
  console.log(`[render] Downloaded ${successItems.length}/${photoItems.length} images successfully`)

  await job.updateProgress(40)

  // 2. Build render params
  const filterGraph   = buildPerPhotoFilterGraph(successItems)
  const totalDuration = successItems.reduce((s, item) => s + item.duration, 0)
  const musicPath     = getMusicPath(music)
  const outputFilename = `${uuidv4()}.mp4`
  const outputPath     = join(UPLOADS_DIR, outputFilename)

  await job.updateProgress(45)

  // 3. Run FFmpeg
  await new Promise((resolve, reject) => {
    let cmd = ffmpeg()

    // Image inputs (still JPEGs — effects handle looping/duration)
    for (const item of successItems) {
      cmd = cmd.input(toFfmpegPath(item.path))
    }

    // Audio: real MP3 or pre-generated silent MP3 fallback
    if (musicPath) {
      cmd = cmd.input(toFfmpegPath(musicPath))
    } else {
      // No music file and silence.mp3 generation failed — skip audio mapping
      console.warn('No audio source available, video will be muted')
    }

    const audioIdx = successItems.length  // audio is the last input

    const filters = [filterGraph]
    const outputOpts = [
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
    ]

    if (musicPath) {
      filters.push(`[${audioIdx}:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS[outa]`)
      outputOpts.push('-map', '[outa]', '-c:a', 'aac', '-b:a', '192k')
    } else {
      outputOpts.push('-an')
    }

    cmd
      .complexFilter(filters)
      .outputOptions(outputOpts)
      .output(toFfmpegPath(outputPath))
      .on('progress', (p) => {
        const pct = 45 + Math.round((p.percent || 0) * 0.5)
        job.updateProgress(Math.min(pct, 95))
      })
      .on('end', resolve)
      .on('error', (err, stdout, stderr) => {
        console.error('[ffmpeg stderr]', stderr)
        reject(err)
      })
      .run()
  })

  await job.updateProgress(95)

  // 4. Clean up temp files
  await rm(jobTmpDir, { recursive: true, force: true })

  await job.updateProgress(100)

  return {
    videoUrl: buildServerVideoUrl(outputFilename),
    filename: outputFilename,
  }
}

// ─── Worker process (polling) ─────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function processOne() {
  const jobId = await redis.lpop(QUEUE_KEY)
  if (!jobId) return false

  let stored
  try {
    stored = await redis.hgetall(`job:${jobId}`)
  } catch (err) {
    console.error(`Failed to fetch job ${jobId}:`, err.message)
    return true
  }

  if (!stored || !stored.data) return true

  await redis.hset(`job:${jobId}`, { status: 'active' })
  stored.status = 'active'

  let data
  try { data = typeof stored.data === 'string' ? JSON.parse(stored.data) : (stored.data ?? {}) } catch { data = {} }

  const job = makeJob(jobId, data, stored)

  try {
    const result = await renderVideo(job)
    await redis.hset(`job:${jobId}`, {
      status: 'completed',
      progress: 100,
      returnvalue: JSON.stringify(result),
    })
    console.log(`✅ Job ${jobId} done → ${result.videoUrl}`)
  } catch (err) {
    await redis.hset(`job:${jobId}`, {
      status: 'failed',
      failedReason: err.message,
    })
    console.error(`❌ Job ${jobId} failed:`, err.message)
  }

  return true
}

async function poll() {
  console.log('🎬 Render worker started (polling Upstash Redis)')
  while (true) {
    try {
      const didWork = await processOne()
      if (!didWork) await sleep(2000)
    } catch (err) {
      console.error('Worker poll error:', err.message)
      await sleep(5000)
    }
  }
}

poll()
