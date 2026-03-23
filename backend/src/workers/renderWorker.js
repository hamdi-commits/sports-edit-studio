/**
 * Render Worker — processes BullMQ jobs
 *
 * Each job: download images → apply FFmpeg effect → mux with music → upload/save
 *
 * Effects implemented via FFmpeg filter_complex:
 *   ken_burns  — slow pan+zoom on each image (zoompan filter)
 *   zoom_burst — rapid zoom-in punch + speed-ramp
 *   flash_cut  — hard cuts with 2-frame white flash between clips
 */

import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '../lib/queue.js'
import ffmpeg from 'fluent-ffmpeg'
import axios from 'axios'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { unlink, readdir, rm } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { pipeline } from 'stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads')
const TMP_DIR     = join(__dirname, '..', '..', 'tmp')
const MUSIC_DIR   = join(__dirname, '..', '..', 'assets', 'music')

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
if (!existsSync(TMP_DIR))     mkdirSync(TMP_DIR,     { recursive: true })

// Optional: point to a specific ffmpeg binary
if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)

// ─── helpers ─────────────────────────────────────────────────────────────────

async function downloadImage(url, destPath) {
  const resp = await axios.get(url, { responseType: 'stream', timeout: 15000 })
  await pipeline(resp.data, createWriteStream(destPath))
}

function buildServerVideoUrl(filename) {
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`
  return `${base}/uploads/${filename}`
}

// ─── FFmpeg effect builders ───────────────────────────────────────────────────

/**
 * Ken Burns — slow zoom+pan.
 * Each image is 3 s at 30 fps → 90 frames.
 * zoompan: zoom from 1.0→1.3, panning slowly.
 */
function buildKenBurnsFilter(imageCount) {
  const fps = 30
  const duration = 3       // seconds per clip
  const frames = fps * duration

  const parts = []
  for (let i = 0; i < imageCount; i++) {
    // Alternate between top-left, center, bottom-right pans
    const panVariants = [
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,              // center
      `x='0':y='0'`,                                              // top-left
      `x='iw-(iw/zoom)':y='ih-(ih/zoom)'`,                       // bottom-right
    ]
    const pan = panVariants[i % panVariants.length]

    parts.push(
      `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,` +
      `crop=1080:1920,` +
      `zoompan=z='min(zoom+0.002,1.3)':${pan}:d=${frames}:s=1080x1920:fps=${fps},` +
      `setpts=PTS-STARTPTS[v${i}]`
    )
  }

  const inputs = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('')
  const filter = [...parts, `${inputs}concat=n=${imageCount}:v=1:a=0[outv]`].join(';')
  return filter
}

/**
 * Zoom Burst — quick zoom-in punch (scale from 1× to 1.5× over 0.5 s) then hold for 1.5 s.
 * Uses scale2ref + overlay trick; simpler: zoompan with fast zoom.
 */
function buildZoomBurstFilter(imageCount) {
  const fps = 30
  const totalFrames = fps * 2     // 2 s per clip
  const burstFrames = fps * 0.5   // 0.5 s zoom burst

  const parts = []
  for (let i = 0; i < imageCount; i++) {
    parts.push(
      `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,` +
      `crop=1080:1920,` +
      `zoompan=z='if(lte(on,${burstFrames}),1+0.5*(on/${burstFrames}),1.5)':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
      `d=${totalFrames}:s=1080x1920:fps=${fps},` +
      `setpts=PTS-STARTPTS[v${i}]`
    )
  }

  const inputs = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('')
  const filter = [...parts, `${inputs}concat=n=${imageCount}:v=1:a=0[outv]`].join(';')
  return filter
}

/**
 * Flash Cut — 1.5 s per clip with a 4-frame white flash at the cut point.
 * White flash = overlay a white rectangle with fade-out using fade filter.
 */
function buildFlashCutFilter(imageCount) {
  const fps = 30
  const clipFrames = fps * 1.5    // 1.5 s per clip
  const flashDuration = 4         // frames

  const parts = []
  for (let i = 0; i < imageCount; i++) {
    parts.push(
      `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,` +
      `crop=1080:1920,` +
      // flash-in at start
      `fade=t=in:st=0:d=${flashDuration / fps}:color=white,` +
      `trim=duration=${clipFrames / fps},` +
      `setpts=PTS-STARTPTS[v${i}]`
    )
  }

  const inputs = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('')
  const filter = [...parts, `${inputs}concat=n=${imageCount}:v=1:a=0[outv]`].join(';')
  return filter
}

function getFilterBuilder(effect) {
  if (effect === 'zoom_burst')  return buildZoomBurstFilter
  if (effect === 'flash_cut')   return buildFlashCutFilter
  return buildKenBurnsFilter   // default
}

function getClipDuration(effect) {
  if (effect === 'zoom_burst')  return 2
  if (effect === 'flash_cut')   return 1.5
  return 3  // ken_burns
}

// ─── Music helper ─────────────────────────────────────────────────────────────

function getMusicPath(musicId) {
  const musicFile = join(MUSIC_DIR, `${musicId}.mp3`)
  if (existsSync(musicFile)) return musicFile
  // Fallback: generate a silent audio file on the fly
  return null
}

// ─── Core render function ─────────────────────────────────────────────────────

async function renderVideo(job) {
  const { photos, effect, music } = job.data
  const jobTmpDir = join(TMP_DIR, job.id)
  mkdirSync(jobTmpDir, { recursive: true })

  await job.updateProgress(5)

  // 1. Download all images
  const imagePaths = []
  for (let i = 0; i < photos.length; i++) {
    const dest = join(jobTmpDir, `img_${i}.jpg`)
    await downloadImage(photos[i], dest)
    imagePaths.push(dest)
    await job.updateProgress(5 + Math.round((i + 1) / photos.length * 35))
  }

  await job.updateProgress(40)

  // 2. Build FFmpeg command
  const outputFilename = `${uuidv4()}.mp4`
  const outputPath = join(UPLOADS_DIR, outputFilename)
  const filterBuilder = getFilterBuilder(effect)
  const filterGraph = filterBuilder(imagePaths.length)
  const musicPath = getMusicPath(music)
  const totalDuration = imagePaths.length * getClipDuration(effect)

  await job.updateProgress(45)

  await new Promise((resolve, reject) => {
    let cmd = ffmpeg()

    // Add all image inputs
    for (const imgPath of imagePaths) {
      cmd = cmd.input(imgPath)
    }

    // Add music input (or generate silence)
    if (musicPath) {
      cmd = cmd.input(musicPath)
    } else {
      // Generate silent audio: use lavfi source
      cmd = cmd.input(`aevalsrc=0:c=stereo:s=44100:d=${totalDuration}`).inputOption('-f lavfi')
    }

    const audioInputIndex = imagePaths.length

    cmd
      .complexFilter([
        filterGraph,
        // Mix/trim audio to match video length
        `[${audioInputIndex}:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS[outa]`
      ])
      .outputOptions([
        '-map [outv]',
        '-map [outa]',
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
      ])
      .output(outputPath)
      .on('progress', (p) => {
        const pct = 45 + Math.round((p.percent || 0) * 0.5)
        job.updateProgress(Math.min(pct, 95))
      })
      .on('end', resolve)
      .on('error', reject)
      .run()
  })

  await job.updateProgress(95)

  // 3. Clean up tmp dir
  await rm(jobTmpDir, { recursive: true, force: true })

  await job.updateProgress(100)

  return { videoUrl: buildServerVideoUrl(outputFilename), filename: outputFilename }
}

// ─── Worker ──────────────────────────────────────────────────────────────────

const worker = new Worker('render', renderVideo, {
  connection,
  concurrency: 2,
})

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed → ${result.videoUrl}`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

worker.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`)
})

console.log('🎬 Render worker started')
