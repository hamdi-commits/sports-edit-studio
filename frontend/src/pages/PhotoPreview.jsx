import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore.js'

export default function PhotoPreview() {
  const navigate = useNavigate()
  const { selectedPhotos, togglePhoto } = useAppStore()

  if (selectedPhotos.length === 0) {
    navigate('/search')
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-14 pb-4 sticky top-0 bg-brand-dark z-10">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/search')} className="text-2xl">←</button>
          <h2 className="text-xl font-black">Your Photos</h2>
        </div>
        <p className="text-gray-400 text-sm">{selectedPhotos.length} selected — tap to remove</p>
      </div>

      <div className="flex-1 px-4 pb-32 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-3 gap-2 mt-2">
          {selectedPhotos.map((photo, i) => (
            <div
              key={i}
              onClick={() => togglePhoto(photo)}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer
                         border-2 border-white/10 active:scale-95 transition-transform"
            >
              <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-end justify-end p-1">
                <span className="text-xs bg-red-500 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  ✕
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white/5 rounded-2xl">
          <p className="text-gray-300 text-sm text-center">
            🎬 Each photo becomes a clip in your video
          </p>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6 flex gap-3">
        <button
          onClick={() => navigate('/search')}
          className="flex-1 py-4 rounded-3xl text-lg font-black bg-white/10 active:scale-95 transition-transform"
        >
          Add More
        </button>
        <button
          onClick={() => navigate('/effects')}
          className="flex-1 py-4 rounded-3xl text-lg font-black bg-gradient-to-r from-brand-purple to-brand-pink
                     active:scale-95 transition-transform"
        >
          Effects →
        </button>
      </div>
    </div>
  )
}
