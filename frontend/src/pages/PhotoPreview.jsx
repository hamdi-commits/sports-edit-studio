import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore.js'

const EFFECTS = [
  { id: 'ken_burns',      emoji: '🔍', name: 'Yakınlaş' },
  { id: 'zoom_out',       emoji: '🔭', name: 'Uzaklaş' },
  { id: 'slide_right',    emoji: '⬅️', name: 'Sola Kay' },
  { id: 'slide_left',     emoji: '➡️', name: 'Sağa Kay' },
  { id: 'slide_up',       emoji: '⬆️', name: 'Yukarı Kay' },
  { id: 'zoom_burst',     emoji: '💥', name: 'Zoom Patla' },
  { id: 'fade',           emoji: '🌫️', name: 'Yumuşak Geçiş' },
  { id: 'rotate_zoom',    emoji: '🌀', name: 'Döner Zoom' },
  { id: 'glitch',         emoji: '⚡', name: 'Glitch' },
  { id: 'pan_horizontal', emoji: '↔️', name: 'Yatay Pan' },
  { id: 'burn_wipe',      emoji: '🔥', name: 'Ateş Geçiş' },
  { id: 'freeze_frame',   emoji: '❄️', name: 'Dondur' },
  { id: 'vhs',            emoji: '📺', name: 'VHS' },
  { id: 'color_shift',    emoji: '🌈', name: 'Renk Kayması' },
  { id: 'sparkle',        emoji: '✨', name: 'Parıltı' },
  { id: 'flash_cut',      emoji: '🎯', name: 'Vurgu Zoom' },
]

const DURATIONS = [
  { value: 1.5, label: '⚡', sub: '1.5s', name: 'Hızlı' },
  { value: 2.5, label: '🏃', sub: '2.5s', name: 'Normal' },
  { value: 4,   label: '🚶', sub: '4s',   name: 'Yavaş' },
  { value: 6,   label: '🐢', sub: '6s',   name: 'Ağır' },
]

export default function PhotoPreview() {
  const navigate = useNavigate()
  const { selectedPhotos, togglePhoto, photoEffects, photoDurations,
          setPhotoEffect, setPhotoDuration } = useAppStore()

  if (selectedPhotos.length === 0) {
    navigate('/search')
    return null
  }

  const totalDuration = selectedPhotos.reduce(
    (s, p) => s + (photoDurations[p.url] || 2.5), 0
  )

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10"
           style={{ background: 'rgba(8,8,24,0.95)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(0,255,135,0.08)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/search')}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                    style={{ background: '#161640', color: '#00ff87' }}>
              ←
            </button>
            <div>
              <h2 className="text-xl font-black text-white">Efekt & Süre</h2>
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {selectedPhotos.length} fotoğraf · toplam ~{totalDuration.toFixed(1)}s
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(0,255,135,0.1)', color: '#00ff87',
                         border: '1px solid rgba(0,255,135,0.2)' }}>
            Sil → dokun
          </span>
        </div>
      </div>

      {/* Photo cards */}
      <div className="flex-1 px-4 pb-36 overflow-y-auto no-scrollbar mt-3 flex flex-col gap-3">
        {selectedPhotos.map((photo, i) => {
          const effect = photoEffects[photo.url] || 'ken_burns'
          const duration = photoDurations[photo.url] || 2.5
          const effectObj = EFFECTS.find((e) => e.id === effect) || EFFECTS[0]

          return (
            <div key={photo.url} className="rounded-2xl overflow-hidden"
                 style={{ background: '#0f0f28', border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Top: thumbnail + info + remove */}
              <div className="flex gap-3 p-3">
                <div className="relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden cursor-pointer"
                     onClick={() => togglePhoto(photo)}
                     style={{ border: '1px solid rgba(255,51,102,0.3)' }}>
                  <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center"
                       style={{ background: 'rgba(255,51,102,0.35)' }}>
                    <span className="text-white font-black text-lg">✕</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-black text-white text-base">Fotoğraf {i + 1}</p>
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {effectObj.emoji} {effectObj.name} · {duration}s
                  </p>
                </div>
              </div>

              {/* Effect selector */}
              <div className="px-3 pb-2">
                <p className="text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  EFEKTİ SEÇ
                </p>
                <div className="relative">
                  <select
                    value={effect}
                    onChange={(e) => setPhotoEffect(photo.url, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-bold appearance-none cursor-pointer
                               focus:outline-none"
                    style={{ background: '#161640', color: 'white',
                             border: '1px solid rgba(0,255,135,0.2)' }}
                  >
                    {EFFECTS.map((ef) => (
                      <option key={ef.id} value={ef.id}>
                        {ef.emoji} {ef.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                       style={{ color: '#00ff87' }}>
                    ▾
                  </div>
                </div>
              </div>

              {/* Duration selector */}
              <div className="px-3 pb-3">
                <p className="text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  SÜRE
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setPhotoDuration(photo.url, d.value)}
                      className="py-2 rounded-xl text-center transition-all active:scale-95"
                      style={duration === d.value
                        ? { background: 'rgba(0,200,255,0.2)', border: '1px solid #00c8ff',
                            boxShadow: '0 0 10px rgba(0,200,255,0.3)' }
                        : { background: '#161640', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="text-lg leading-tight">{d.label}</div>
                      <div className="text-xs font-black"
                           style={{ color: duration === d.value ? '#00c8ff' : 'rgba(255,255,255,0.5)' }}>
                        {d.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* Summary */}
        <div className="p-4 rounded-2xl text-center"
             style={{ background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)' }}>
          <p className="text-sm font-bold" style={{ color: '#00ff87' }}>
            🎬 Toplam video süresi: ~{totalDuration.toFixed(1)} saniye
          </p>
        </div>
      </div>

      {/* Continue */}
      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6 flex gap-3">
        <button
          onClick={() => navigate('/search')}
          className="flex-1 py-4 rounded-2xl text-base font-black active:scale-95 transition-all"
          style={{ background: '#161640', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
        >
          + Ekle
        </button>
        <button
          onClick={() => navigate('/music')}
          className="flex-1 py-4 rounded-2xl text-base font-black active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #00ff87, #00c8ff)',
                   color: '#080818',
                   boxShadow: '0 0 20px rgba(0,255,135,0.4)' }}
        >
          Müzik →
        </button>
      </div>
    </div>
  )
}
