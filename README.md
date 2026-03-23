# 🏆 Sports Edit Studio

A personal iPhone PWA that lets Can create epic sports highlight videos. Search for an athlete, pick photos, add effects and music — get a 9:16 MP4 ready to share.

---

## Project Structure

```
sports-edit-studio/
├── frontend/          # React + Vite + Tailwind PWA  → deploy on Vercel
│   ├── src/
│   │   ├── pages/     # Home, AthleteSearch, PhotoPreview, EffectSelection,
│   │   │              # MusicSelection, Rendering, VideoPreview
│   │   └── store/     # Zustand global state
│   └── public/        # manifest.json, icons
└── backend/           # Fastify API + BullMQ worker → deploy on Railway
    └── src/
        ├── routes/    # /api/search-images, /api/render
        └── workers/   # renderWorker.js (FFmpeg)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| FFmpeg | ≥ 6 (system install) |
| Redis | Upstash (cloud) or local |

Install FFmpeg:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port (default: 3001) |
| `GOOGLE_API_KEY` | Yes* | Google Cloud API key |
| `GOOGLE_CSE_ID` | Yes* | Custom Search Engine ID |
| `UPSTASH_REDIS_URL` | Yes | `rediss://default:TOKEN@host:6380` |
| `BACKEND_URL` | No | Public URL for video links (Railway URL) |
| `R2_ACCOUNT_ID` | Phase 2 | Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | Phase 2 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Phase 2 | R2 secret |
| `R2_BUCKET_NAME` | Phase 2 | R2 bucket name |
| `ANTHROPIC_API_KEY` | Phase 2 | Claude API for hashtags |

*Without Google keys, the backend returns placeholder images automatically (great for testing).

### Frontend (`frontend/.env.local`)

```
VITE_API_URL=http://localhost:3001
```

For production on Vercel, the Vite proxy is not used — set:
```
VITE_API_URL=https://your-railway-app.railway.app
```

---

## How to get Google Custom Search credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Custom Search API**
3. Create an API key → paste as `GOOGLE_API_KEY`
4. Go to [Programmable Search Engine](https://programmablesearchengine.google.com)
5. Create a new engine → enable **Image Search** → get the CX ID → paste as `GOOGLE_CSE_ID`

---

## How to get Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a free Redis database
3. Copy the **TLS URL** → paste as `UPSTASH_REDIS_URL`

---

## Running Locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in your values
npm run dev             # starts API server on :3001
```

In a second terminal:
```bash
cd backend
npm run worker          # starts FFmpeg render worker
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev             # starts Vite on :5173 (proxies /api → :3001)
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## End-to-End Test

1. Open the app → tap **Create Video**
2. Type `Cristiano Ronaldo` → tap 🔍
3. Select 3–5 photos
4. Choose **Zoom Burst** effect
5. Pick **Hype Trap** music
6. Tap **Make My Video!**
7. Watch the progress bar — video appears when done
8. Tap **Save to Phone** or **Share**

---

## Deploying

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set env var in Vercel dashboard: `VITE_API_URL=https://your-railway-app.railway.app`

### Backend → Railway

1. Push to GitHub
2. New Railway project → Deploy from GitHub
3. Add env vars in Railway dashboard
4. Railway auto-detects `railway.toml` and runs both API + worker services

---

## Adding Music Tracks

Place MP3 files in `backend/assets/music/`:

```
backend/assets/music/
├── epic_rock.mp3
├── hype_trap.mp3
├── stadium_anthem.mp3
├── chill_lofi.mp3
└── dubstep_drop.mp3
```

If a track file is missing, the worker generates silent audio automatically.
Use royalty-free tracks from [pixabay.com/music](https://pixabay.com/music) or [freemusicarchive.org](https://freemusicarchive.org).

---

## FFmpeg Effects

| Effect | Description | Duration/clip |
|--------|-------------|---------------|
| **Ken Burns** | Slow pan + zoom (1.0× → 1.3×) | 3 s |
| **Zoom Burst** | Fast punch zoom (1.0× → 1.5× in 0.5 s) | 2 s |
| **Flash Cut** | Hard cuts with white flash | 1.5 s |

All output: **1080×1920** (9:16), **H.264/AAC**, **30 fps**.

---

## Phase 2 Roadmap

- [ ] Google OAuth login
- [ ] SQLite job history (better-sqlite3)
- [ ] Upload music to Cloudflare R2
- [ ] AI hashtag suggestions (Claude claude-haiku)
- [ ] TikTok/Instagram direct share
- [ ] More effects (Glitch, Slow-Mo, Neon)
