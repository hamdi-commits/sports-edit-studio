import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

const MUSIC_TRACKS = [
  { id: 'epic_rock',      name: 'Epic Rock',       emoji: '🎸', bpm: 140, duration: '0:30' },
  { id: 'hype_trap',      name: 'Hype Trap',        emoji: '🔥', bpm: 155, duration: '0:30' },
  { id: 'stadium_anthem', name: 'Stadium Anthem',   emoji: '🏟️', bpm: 128, duration: '0:30' },
  { id: 'chill_lofi',     name: 'Chill Lo-Fi',      emoji: '🎵', bpm: 90,  duration: '0:30' },
  { id: 'dubstep_drop',   name: 'Dubstep Drop',     emoji: '💿', bpm: 140, duration: '0:30' },
]

export default function MusicSelection() {
  const navigate = useNavigate()
  const { selectedMusic, setSelectedMusic, selectedPhotos, selectedEffect, setJobId } = useAppStore()

  async function handleRender() {
    try {
      const { data } = await axios.post('/api/render', {
        photos: selectedPhotos.map((p) => p.url),
        effect: selectedEffect,
        music: selectedMusic,
      })
      setJobId(data.jobId)
      navigate('/rendering')
    } catch {
      alert('Failed to start render — try again!')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-14 pb-4 sticky top-0 bg-brand-dark z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/effects')} className="text-2xl">←</button>
          <h2 className="text-xl font-black">Pick the Music</h2>
        </div>
      </div>

      <div className="flex-1 px-4 pb-32 flex flex-col gap-3 mt-4">
        {MUSIC_TRACKS.map((track) => {
          const selected = selectedMusic === track.id
          return (
            <button
              key={track.id}
              onClick={() => setSelectedMusic(track.id)}
              className={`w-full p-5 rounded-3xl flex items-center gap-4 transition-all active:scale-95
                          border-4 ${selected ? 'border-brand-yellow bg-white/15' : 'border-white/10 bg-white/5'}`}
            >
              <span className="text-4xl">{track.emoji}</span>
              <div className="text-left flex-1">
                <p className="text-xl font-black text-white">{track.name}</p>
                <p className="text-gray-400 text-sm">{track.bpm} BPM · {track.duration}</p>
              </div>
              {selected && <span className="text-3xl">🎵</span>}
            </button>
          )
        })}
      </div>

      {selectedMusic && (
        <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6">
          <button
            onClick={handleRender}
            className="w-full py-5 rounded-3xl text-2xl font-black bg-gradient-to-r from-green-500 to-cyan-400
                       text-black active:scale-95 transition-transform shadow-xl shadow-green-900/40"
          >
            🚀 Make My Video!
          </button>
        </div>
      )}
    </div>
  )
}
