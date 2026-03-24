import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

const COUNT_OPTIONS = [3, 5, 8, 10, 15, 20]

export default function AthleteSearch() {
  const navigate = useNavigate()
  const {
    athleteName, setAthleteName,
    searchResults, setSearchResults,
    selectedPhotos, togglePhoto,
    photoCount, setPhotoCount,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newOnly, setNewOnly] = useState(false)

  function getUsedUrls() {
    if (!athleteName.trim()) return []
    try {
      return JSON.parse(localStorage.getItem(`used_photos_${athleteName.toLowerCase().trim()}`) || '[]')
    } catch { return [] }
  }

  async function handleSearch() {
    if (!athleteName.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get('/api/search-images', { params: { q: athleteName } })
      setSearchResults(data.images)
    } catch {
      setError('Arama başarısız — internet bağlantınızı kontrol edin!')
    } finally {
      setLoading(false)
    }
  }

  const usedUrls = getUsedUrls()
  const visibleResults = newOnly
    ? searchResults.filter((img) => !usedUrls.includes(img.url))
    : searchResults

  const canContinue = selectedPhotos.length >= photoCount

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10"
           style={{ background: 'rgba(8,8,24,0.95)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(0,255,135,0.08)' }}>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ background: '#161640', color: '#00ff87' }}>
            ←
          </button>
          <h2 className="text-xl font-black text-white">Sporcu Ara</h2>
        </div>

        {/* Photo count selector */}
        <div className="mb-3">
          <p className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            KAÇ FOTOĞRAF SEÇECEKSİN?
          </p>
          <div className="tab-row">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setPhotoCount(n)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95"
                style={photoCount === n
                  ? { background: '#00ff87', color: '#080818',
                      boxShadow: '0 0 12px rgba(0,255,135,0.5)' }
                  : { background: '#161640', color: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={athleteName}
            onChange={(e) => setAthleteName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="ör. Lionel Messi"
            className="flex-1 px-4 py-3 rounded-xl text-base text-white font-semibold
                       focus:outline-none placeholder-white/30"
            style={{ background: '#161640', border: '1px solid rgba(0,255,135,0.2)' }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-3 rounded-xl text-xl font-black active:scale-95 transition-all disabled:opacity-50"
            style={{ background: '#00ff87', color: '#080818',
                     boxShadow: loading ? 'none' : '0 0 16px rgba(0,255,135,0.4)' }}
          >
            {loading ? '⏳' : '🔍'}
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-bold"
             style={{ color: selectedPhotos.length > 0 ? '#ffd700' : 'rgba(255,255,255,0.3)' }}>
            {selectedPhotos.length > 0
              ? `${selectedPhotos.length}/${photoCount} seçildi`
              : `${photoCount} fotoğraf seçeceksin`}
          </p>
          {searchResults.length > 0 && usedUrls.length > 0 && (
            <button
              onClick={() => setNewOnly(!newOnly)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all"
              style={newOnly
                ? { background: 'rgba(0,200,255,0.2)', color: '#00c8ff',
                    border: '1px solid rgba(0,200,255,0.4)' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span>{newOnly ? '✅' : '○'}</span> Sadece Yeni
            </button>
          )}
        </div>
      </div>

      {/* Results grid */}
      <div className="flex-1 px-4 pb-36 overflow-y-auto no-scrollbar mt-2">
        {error && (
          <div className="mt-4 p-4 rounded-xl text-center text-sm font-bold"
               style={{ background: 'rgba(255,51,102,0.15)', color: '#ff3366',
                        border: '1px solid rgba(255,51,102,0.3)' }}>
            {error}
          </div>
        )}

        {!loading && searchResults.length === 0 && (
          <div className="mt-20 text-center">
            <p className="text-6xl mb-4">🏅</p>
            <p className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Favori sporcunu ara!
            </p>
          </div>
        )}

        {newOnly && visibleResults.length === 0 && searchResults.length > 0 && (
          <div className="mt-12 text-center p-6 rounded-2xl"
               style={{ background: '#0f0f28', border: '1px solid rgba(0,200,255,0.2)' }}>
            <p className="text-4xl mb-3">🔄</p>
            <p className="font-bold text-white mb-1">Tüm fotoğraflar kullanıldı</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Yeni arama yapmayı deneyin
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          {visibleResults.map((img, i) => {
            const selected = selectedPhotos.some((p) => p.url === img.url)
            const isUsed = usedUrls.includes(img.url)
            const disabled = !selected && selectedPhotos.length >= photoCount
            return (
              <div
                key={i}
                onClick={() => !disabled && togglePhoto(img)}
                className="relative rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-95"
                style={{
                  aspectRatio: '1',
                  border: selected
                    ? '2px solid #00ff87'
                    : '2px solid rgba(255,255,255,0.06)',
                  boxShadow: selected ? '0 0 16px rgba(0,255,135,0.4)' : 'none',
                  opacity: disabled && !selected ? 0.4 : 1,
                  transform: selected ? 'scale(0.97)' : 'scale(1)',
                }}
              >
                <img src={img.thumbnail} alt={img.title}
                     className="w-full h-full object-cover" loading="lazy" />
                {selected && (
                  <div className="absolute inset-0 flex items-center justify-center"
                       style={{ background: 'rgba(0,255,135,0.25)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                         style={{ background: '#00ff87', color: '#080818' }}>
                      ✓
                    </div>
                  </div>
                )}
                {isUsed && !selected && !newOnly && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold"
                       style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)' }}>
                    kullanıldı
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Continue button */}
      {canContinue && (
        <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6">
          <button
            onClick={() => navigate('/preview')}
            className="w-full py-5 rounded-2xl text-xl font-black active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #00ff87, #00c8ff)',
                     color: '#080818',
                     boxShadow: '0 0 30px rgba(0,255,135,0.5)' }}
          >
            Devam Et ({selectedPhotos.length}) →
          </button>
        </div>
      )}
    </div>
  )
}
