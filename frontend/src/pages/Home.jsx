import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore.js'

export default function Home() {
  const navigate = useNavigate()
  const reset = useAppStore((s) => s.reset)

  function handleStart() {
    reset()
    navigate('/search')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-8">
      {/* Animated logo */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-brand-purple opacity-30 animate-pulse-ring" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-2xl">
          <span className="text-6xl">🏆</span>
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
          Sports Edit<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-brand-pink">
            Studio
          </span>
        </h1>
        <p className="mt-3 text-lg text-gray-400">Make epic highlight videos!</p>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-5 rounded-3xl text-2xl font-black bg-gradient-to-r from-brand-purple to-brand-pink
                   shadow-lg shadow-purple-900/50 active:scale-95 transition-transform"
      >
        🎬 Create Video
      </button>

      <p className="text-xs text-gray-600">Made for Can ⚽</p>
    </div>
  )
}
