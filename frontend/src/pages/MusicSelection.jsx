import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

const MOODS = [
  { key: 'HYPE',      label: 'HYPE',      color: '#ff3366' },
  { key: 'CHILL',     label: 'SAKIN',     color: '#00c8ff' },
  { key: 'EPIC',      label: 'EPİK',      color: '#ffd700' },
  { key: 'DRAMATIC',  label: 'DRAMATİK',  color: '#a855f7' },
  { key: 'FUNNY',     label: 'KOMİK',     color: '#00ff87' },
]

// Free royalty-free music — SoundHelix sample tracks.
// Replace urls with Pixabay CDN links (https://cdn.pixabay.com/audio/…)
// once you have API access or have downloaded specific tracks.
const BASE = 'https://www.soundhelix.com/examples/mp3'

const MUSIC_LIBRARY = {
  HYPE: [
    { id: 'hype_trap',    name: 'Trap Beast',   emoji: '🔥', bpm: 155, url: `${BASE}/SoundHelix-Song-1.mp3` },
    { id: 'hype_bounce',  name: 'Bounce Zone',  emoji: '⚡', bpm: 145, url: `${BASE}/SoundHelix-Song-2.mp3` },
    { id: 'hype_rage',    name: 'Rage Mode',    emoji: '😤', bpm: 160, url: `${BASE}/SoundHelix-Song-3.mp3` },
    { id: 'hype_drill',   name: 'UK Drill',     emoji: '🎯', bpm: 140, url: `${BASE}/SoundHelix-Song-4.mp3` },
    { id: 'hype_phonk',   name: 'Phonk Rider',  emoji: '🏎️', bpm: 135, url: `${BASE}/SoundHelix-Song-5.mp3` },
    { id: 'hype_jersey',  name: 'Jersey Club',  emoji: '💃', bpm: 150, url: `${BASE}/SoundHelix-Song-6.mp3` },
  ],
  CHILL: [
    { id: 'chill_lofi',    name: 'Lo-Fi Dreams',  emoji: '🎵', bpm: 90,  url: `${BASE}/SoundHelix-Song-7.mp3` },
    { id: 'chill_wave',    name: 'Chillwave',      emoji: '🌊', bpm: 100, url: `${BASE}/SoundHelix-Song-8.mp3` },
    { id: 'chill_jazz',    name: 'Smooth Jazz',    emoji: '🎷', bpm: 85,  url: `${BASE}/SoundHelix-Song-9.mp3` },
    { id: 'chill_ambient', name: 'Ambient Flow',   emoji: '🌙', bpm: 75,  url: `${BASE}/SoundHelix-Song-10.mp3` },
    { id: 'chill_rnb',     name: 'R&B Groove',     emoji: '🎤', bpm: 95,  url: `${BASE}/SoundHelix-Song-11.mp3` },
    { id: 'chill_synth',   name: 'Synth Pop',      emoji: '🎹', bpm: 105, url: `${BASE}/SoundHelix-Song-12.mp3` },
  ],
  EPIC: [
    { id: 'epic_rock',      name: 'Epic Rock',        emoji: '🎸', bpm: 140, url: `${BASE}/SoundHelix-Song-13.mp3` },
    { id: 'epic_orchestra', name: 'Orkestra Yükseliş', emoji: '🎻', bpm: 120, url: `${BASE}/SoundHelix-Song-14.mp3` },
    { id: 'epic_hybrid',    name: 'Hybrid Trailer',   emoji: '🎬', bpm: 130, url: `${BASE}/SoundHelix-Song-15.mp3` },
    { id: 'epic_anthem',    name: 'Stadyum Marşı',    emoji: '🏟️', bpm: 128, url: `${BASE}/SoundHelix-Song-16.mp3` },
    { id: 'epic_metal',     name: 'Metal Fırtınası',  emoji: '🤘', bpm: 165, url: `${BASE}/SoundHelix-Song-17.mp3` },
    { id: 'epic_cinematic', name: 'Sinematik Dalga',  emoji: '🌅', bpm: 115, url: `${BASE}/SoundHelix-Song-1.mp3` },
  ],
  DRAMATIC: [
    { id: 'drama_tension',  name: 'Gerilim',         emoji: '😰', bpm: 80, url: `${BASE}/SoundHelix-Song-2.mp3` },
    { id: 'drama_dark',     name: 'Karanlık Drama',   emoji: '🌑', bpm: 70, url: `${BASE}/SoundHelix-Song-3.mp3` },
    { id: 'drama_piano',    name: 'Solo Piyano',      emoji: '🎹', bpm: 65, url: `${BASE}/SoundHelix-Song-7.mp3` },
    { id: 'drama_strings',  name: 'Yaylı Dörtlüsü',  emoji: '🎻', bpm: 75, url: `${BASE}/SoundHelix-Song-8.mp3` },
    { id: 'drama_bass',     name: 'Bass Patlaması',   emoji: '🔊', bpm: 85, url: `${BASE}/SoundHelix-Song-5.mp3` },
    { id: 'drama_suspense', name: 'Gerilim Döngüsü',  emoji: '😱', bpm: 90, url: `${BASE}/SoundHelix-Song-6.mp3` },
  ],
  FUNNY: [
    { id: 'funny_circus',  name: 'Sirk Teması',     emoji: '🎪', bpm: 120, url: `${BASE}/SoundHelix-Song-4.mp3` },
    { id: 'funny_cartoon', name: 'Karikatür Koşu',  emoji: '🐭', bpm: 140, url: `${BASE}/SoundHelix-Song-9.mp3` },
    { id: 'funny_ska',     name: 'Ska Partisi',     emoji: '🎺', bpm: 160, url: `${BASE}/SoundHelix-Song-10.mp3` },
    { id: 'funny_polka',   name: 'Parti Polkası',   emoji: '🥳', bpm: 130, url: `${BASE}/SoundHelix-Song-11.mp3` },
    { id: 'funny_8bit',    name: '8-Bit Eğlence',   emoji: '👾', bpm: 110, url: `${BASE}/SoundHelix-Song-12.mp3` },
    { id: 'funny_quirky',  name: 'Tuhaf Yürüyüş',   emoji: '🦆', bpm: 100, url: `${BASE}/SoundHelix-Song-13.mp3` },
  ],
}

export default function MusicSelection() {
  const navigate = useNavigate()
  const {
    selectedMusic, setSelectedMusic,
    selectedPhotos, photoEffects, photoDurations,
    athleteName, setJobId,
  } = useAppStore()

  const [activeMood, setActiveMood] = useState('HYPE')
  const [previewId, setPreviewId] = useState(null)
  const [rendering, setRendering] = useState(false)
  const audioRef = useRef(null)

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPreviewId(null)
  }

  function handlePreview(track) {
    // Toggle off
    if (previewId === track.id) { stopPreview(); return }

    stopPreview()
    setPreviewId(track.id)

    const audio = new Audio(track.url)
    audio.volume = 0.6
    audio.play().catch(() => {})
    audioRef.current = audio

    // Stop after 5 s
    const timer = setTimeout(() => {
      audio.pause()
      setPreviewId(null)
    }, 5000)

    // Also stop when audio ends naturally (short files)
    audio.onended = () => { clearTimeout(timer); setPreviewId(null) }
  }

  // Flatten all tracks to a map: id → track (for URL lookup at render time)
  const allTracks = Object.values(MUSIC_LIBRARY).flat()
  const trackById = Object.fromEntries(allTracks.map((t) => [t.id, t]))

  async function handleRender() {
    if (!selectedMusic || rendering) return
    setRendering(true)

    // Save used photos to localStorage
    const key = `used_photos_${athleteName.toLowerCase().trim()}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const newUsed = [...new Set([...existing, ...selectedPhotos.map((p) => p.url)])]
    localStorage.setItem(key, JSON.stringify(newUsed))

    const musicUrl = trackById[selectedMusic]?.url || null

    try {
      const { data } = await axios.post('/api/render', {
        photos: selectedPhotos.map((p) => ({
          url: p.url,
          effect: photoEffects[p.url] || 'ken_burns',
          duration: photoDurations[p.url] || 2.5,
        })),
        music:    selectedMusic,
        musicUrl: musicUrl,
      })
      setJobId(data.jobId)
      navigate('/rendering')
    } catch {
      alert('Render başlatılamadı — tekrar deneyin!')
      setRendering(false)
    }
  }

  const moodColor = MOODS.find((m) => m.key === activeMood)?.color || '#00ff87'

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 sticky top-0 z-10"
           style={{ background: 'rgba(8,8,24,0.95)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(0,255,135,0.08)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/preview')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ background: '#161640', color: '#00ff87' }}>
            ←
          </button>
          <div>
            <h2 className="text-xl font-black text-white">Müzik Seç</h2>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              30 parça · 5 atmosfer
            </p>
          </div>
        </div>

        {/* Mood tabs */}
        <div className="tab-row">
          {MOODS.map((mood) => (
            <button
              key={mood.key}
              onClick={() => setActiveMood(mood.key)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all active:scale-95"
              style={activeMood === mood.key
                ? { background: mood.color + '22', color: mood.color,
                    border: `1px solid ${mood.color}66`,
                    boxShadow: `0 0 10px ${mood.color}33` }
                : { background: '#161640', color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 px-4 pb-36 overflow-y-auto no-scrollbar mt-3 flex flex-col gap-2">
        {(MUSIC_LIBRARY[activeMood] || []).map((track) => {
          const selected   = selectedMusic === track.id
          const previewing = previewId === track.id
          return (
            <div
              key={track.id}
              onClick={() => setSelectedMusic(track.id)}
              className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all active:scale-95"
              style={selected
                ? { background: moodColor + '18', border: `1px solid ${moodColor}55`,
                    boxShadow: `0 0 16px ${moodColor}22` }
                : { background: '#0f0f28', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-3xl flex-shrink-0">{track.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base truncate">{track.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: moodColor + '22', color: moodColor }}>
                    {track.bpm} BPM
                  </span>
                  <span className="text-xs font-semibold"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {activeMood}
                  </span>
                </div>
              </div>
              {/* Preview button */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePreview(track) }}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                style={previewing
                  ? { background: moodColor, color: '#080818' }
                  : { background: '#161640', color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {previewing ? '■' : '▶'}
              </button>
              {selected && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                     style={{ background: moodColor, color: '#080818' }}>
                  ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Render button */}
      {selectedMusic && (
        <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6">
          <button
            onClick={handleRender}
            disabled={rendering}
            className="w-full py-5 rounded-2xl text-xl font-black active:scale-95 transition-all disabled:opacity-60"
            style={{ background: rendering
                       ? 'rgba(0,255,135,0.3)'
                       : 'linear-gradient(135deg, #00ff87, #ffd700)',
                     color: '#080818',
                     boxShadow: rendering ? 'none' : '0 0 30px rgba(0,255,135,0.5)' }}
          >
            {rendering ? '⏳ Hazırlanıyor...' : '🚀 Videoyu Oluştur!'}
          </button>
        </div>
      )}
    </div>
  )
}
