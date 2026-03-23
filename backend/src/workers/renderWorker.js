/**
 * Render Worker — processes BullMQ jobs
 *
 * Each job: download images → apply FFmpeg effect → mux with music → save MP4
 *
 * Effects (all output 1080×1920 @ 30 fps H.264/AAC):
 *   ken_burns  — slow pan+zoom via zoompan filter (3 s/clip)
 *   zoom_burst — fast punch zoom via zoompan (2 s/clip)
 *   flash_cut  — loop+trim with white fade-in flash (1.5 s/clip)
 */

import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection } from '../lib/queue.js'
import ffmpeg from 'fluent-ffmpeg'
import axios from 'axios'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { rm } from 'fs/promises'
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

// ─── FFmpeg effect filter builders ───────────────────────────────────────────

/**
 * Ken Burns — slow zoom+pan using zoompan filter.
 * zoompan handles looping still images internally.
 * 3 clips × 3 s = 9 s for 3 photos.
 */
function buildKenBurnsFilter(imageCount) {
  const fps = 30
  const clipDuration = 3
  const frames = fps * clipDuration

  // Three pan destinations cycling across clips
  const panVariants = [
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,   // center zoom
    `x='0':y='0'`,                                    // top-left corner
    `x='iw-(iw/zoom)':y='ih-(ih/zoom)'`,             // bottom-right corner
  ]

  const parts = []
  for (let i = 0; i < imageCount; i++) {
    const pan = panVariants[i % panVariants.length]
    parts.push(
      `[${i}:v]` +
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
      `zoompan=z='min(zoom+0.002,1.3)':${pan}:d=${frames}:s=1080x1920:fps=${fps},` +
      `setpts=PTS-STARTPTS` +
      `[v${i}]`
    )
  }

  const concat = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('')
  return [...parts, `${concat}concat=n=${imageCount}:v=1:a=0[outv]`].join(';')
}

/**
 * Zoom Burst — zoompan with fast initial zoom from 1.0→1.5 over 0.5 s.
 * 2 s/clip total.
 */
function buildZoomBurstFilter(imageCount) {
  const fps = 30
  const clipDuration = 2
  const totalFrames = fps * clipDuration
  const burstFrames = fps * 0.5  // 15 frames

  const parts = []
  for (let i = 0; i < imageCount; i++) {
    parts.push(
      `[${i}:v]` +
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
      `zoompan=z='if(lte(on,${burstFrames}),1+0.5*(on/${burstFrames}),1.5)':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
      `d=${totalFrames}:s=1080x1920:fps=${fps},` +
      `setpts=PTS-STARTPTS` +
      `[v${i}]`
    )
  }

  const concat = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('')
  return [...parts, `${concat}concat=n=${imageCount}:v=1:a=0[outv]`].join(';')
}

/**
 * Flash Cut — hard cuts with a white flash at the start of each clip.
 *
 * Still images have no native duration, so we use:
 *   loop=loop=-1:size=1  → loops the single frame indefinitely
 *   trim=duration=X      → limits to clip length
 *   fps=fps=30           → forces output frame rate
 *   fade=in white        → white flash for first 4 frames
 *
 * 1.5 s/clip.
 */
function buildFlashCutFilter(imageCount) {
  const fps = 30
  const clipDuration = 1.5
  const flashDuration = 4 / fps  // 4 frames ≈ 0.133 s

  const parts = []
  for (let i = 0; i < imageCount; i++) {
    parts.push(
      `[${i}:v]` +
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
      // loop the still image forever, then trim to clip length
      `loop=loop=-1:size=1:start=0,` +
      `trim=duration=${clipDuration},` +
      `fps=fps=${fps},` +
      `fade=t=in:st=0:d=${flashDuration}:color=white,` +
      `setpts=PTS-STARTPTS` +
      `[v${i}]`
    )
  }

  const concat = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('')
  return [...parts, `${concat}concat=n=${imageCount}:v=1:a=0[outv]`].join(';')
}

function getFilterBuilder(effect) {
  if (effect === 'zoom_burst') return buildZoomBurstFilter
  if (effect === 'flash_cut')  return buildFlashCutFilter
  return buildKenBurnsFilter
}

function getClipDuration(effect) {
  if (effect === 'zoom_burst') return 2
  if (effect === 'flash_cut')  return 1.5
  return 3  // ken_burns
}

// ─── Music ───────────────────────────────────────────────────────────────────

function getMusicPath(musicId) {
  const path = join(MUSIC_DIR, `${musicId}.mp3`)
  return existsSync(path) ? path : null
}

// ─── Core render ─────────────────────────────────────────────────────────────

async function renderVideo(job) {
  const { photos, effect, music } = job.data
  const jobTmpDir = join(TMP_DIR, job.id)
  mkdirSync(jobTmpDir, { recursive: true })

  await job.updateProgress(5)

  // 1. Download images in parallel (max 4 at a time)
  const imagePaths = Array.from({ length: photos.length }, (_, i) =>
    join(jobTmpDir, `img_${i}.jpg`)
  )

  const CHUNK = 4
  for (let start = 0; start < photos.length; start += CHUNK) {
    await Promise.all(
      photos.slice(start, start + CHUNK).map((url, j) =>
        downloadImage(url, imagePaths[start + j])
      )
    )
    await job.updateProgress(5 + Math.round(((start + CHUNK) / photos.length) * 35))
  }

  await job.updateProgress(40)

  // 2. Build render params
  const filterGraph   = getFilterBuilder(effect)(imagePaths.length)
  const totalDuration = imagePaths.length * getClipDuration(effect)
  const musicPath     = getMusicPath(music)
  const outputFilename = `${uuidv4()}.mp4`
  const outputPath     = join(UPLOADS_DIR, outputFilename)

  await job.updateProgress(45)

  // 3. Run FFmpeg
  await new Promise((resolve, reject) => {
    let cmd = ffmpeg()

    // Image inputs (still JPEGs — effects handle looping/duration)
    for (const imgPath of imagePaths) {
      cmd = cmd.input(imgPath)
    }

    // Audio: real MP3 or silent lavfi track
    if (musicPath) {
      cmd = cmd.input(musicPath)
    } else {
      // anullsrc generates a silent stereo track; -t limits duration
      cmd = cmd
        .input('anullsrc=r=44100:cl=stereo')
        .inputOptions(['-f', 'lavfi', '-t', String(totalDuration)])
    }

    const audioIdx = imagePaths.length  // audio is the last input

    cmd
      .complexFilter([
        filterGraph,
        `[${audioIdx}:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS[outa]`,
      ])
      .outputOptions([
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
      ])
      .output(outputPath)
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

// ─── Worker process ──────────────────────────────────────────────────────────

const worker = new Worker('render', renderVideo, {
  connection,
  concurrency: 2,
})

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} done → ${result.videoUrl}`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

worker.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id}: ${progress}%`)
})

console.log('🎬 Render worker started (concurrency=2)')
