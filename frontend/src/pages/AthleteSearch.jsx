import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

export default function AthleteSearch() {
  const navigate = useNavigate()
  const { athleteName, setAthleteName, searchResults, setSearchResults, selectedPhotos, togglePhoto } =
    useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch() {
    if (!athleteName.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get('/api/search-images', { params: { q: athleteName } })
      setSearchResults(data.images)
    } catch (e) {
      setError('Could not search — check your internet!')
    } finally {
      setLoading(false)
    }
  }

  const canContinue = selectedPhotos.length >= 3

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 bg-brand-dark sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="text-2xl">←</button>
          <h2 className="text-xl font-black">Find an Athlete</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={athleteName}
            onChange={(e) => setAthleteName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Lionel Messi"
            className="flex-1 bg-white/10 rounded-2xl px-4 py-3 text-lg text-white placeholder-gray-500
                       border border-white/10 focus:outline-none focus:border-brand-purple"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-3 bg-brand-purple rounded-2xl text-xl active:scale-95 transition-transform
                       disabled:opacity-50"
          >
            {loading ? '⏳' : '🔍'}
          </button>
        </div>
        {selectedPhotos.length > 0 && (
          <p className="mt-2 text-sm text-brand-yellow font-bold">
            {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected (need at least 3)
          </p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 px-4 pb-32 overflow-y-auto no-scrollbar">
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 rounded-2xl text-red-300 text-center">{error}</div>
        )}

        {!loading && searchResults.length === 0 && (
          <div className="mt-16 text-center text-gray-500">
            <p className="text-5xl mb-4">🏅</p>
            <p className="text-lg">Search for your favorite athlete!</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {searchResults.map((img, i) => {
            const selected = selectedPhotos.some((p) => p.url === img.url)
            return (
              <div
                key={i}
                onClick={() => togglePhoto(img)}
                className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer
                            border-4 transition-all active:scale-95
                            ${selected ? 'border-brand-yellow scale-95 shadow-lg shadow-yellow-500/30' : 'border-transparent'}`}
              >
                <img
                  src={img.thumbnail}
                  alt={img.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selected && (
                  <div className="absolute inset-0 bg-brand-yellow/20 flex items-center justify-center">
                    <span className="text-4xl">✅</span>
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
            className="w-full py-5 rounded-3xl text-2xl font-black bg-gradient-to-r from-brand-yellow to-brand-pink
                       text-black shadow-xl active:scale-95 transition-transform"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
