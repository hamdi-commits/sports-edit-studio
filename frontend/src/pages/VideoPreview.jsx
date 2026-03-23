import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore.js'

export default function VideoPreview() {
  const navigate = useNavigate()
  const { videoUrl, athleteName, reset } = useAppStore()

  if (!videoUrl) {
    navigate('/')
    return null
  }

  function handleDownload() {
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${athleteName || 'sports'}-edit.mp4`
    a.click()
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'My Sports Edit', url: videoUrl }).catch(() => {})
    } else {
      handleDownload()
    }
  }

  function handleNew() {
    reset()
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-14 pb-4 sticky top-0 bg-brand-dark z-10">
        <h2 className="text-xl font-black text-center">Your Video is Ready! 🎉</h2>
      </div>

      <div className="flex-1 flex flex-col items-center gap-6 px-4 pb-32 mt-4">
        {/* Video player */}
        <div className="w-full rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/50 bg-black
                        border-2 border-brand-purple/40">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            playsInline
            className="w-full aspect-[9/16]"
          />
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleDownload}
            className="w-full py-5 rounded-3xl text-xl font-black bg-gradient-to-r from-brand-purple to-brand-pink
                       active:scale-95 transition-transform shadow-lg"
          >
            ⬇️ Save to Phone
          </button>
          <button
            onClick={handleShare}
            className="w-full py-5 rounded-3xl text-xl font-black bg-gradient-to-r from-green-500 to-cyan-400
                       text-black active:scale-95 transition-transform"
          >
            📤 Share
          </button>
          <button
            onClick={handleNew}
            className="w-full py-4 rounded-3xl text-lg font-black bg-white/10
                       active:scale-95 transition-transform"
          >
            🔄 Make Another!
          </button>
        </div>
      </div>
    </div>
  )
}
