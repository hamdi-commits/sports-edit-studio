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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-10"
         style={{ background: 'radial-gradient(ellipse at top, #0d0d30 0%, #080818 70%)' }}>

      {/* Animated logo */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 rounded-full animate-pulse-ring"
             style={{ background: 'rgba(0,255,135,0.15)' }} />
        <div className="absolute w-36 h-36 rounded-full animate-pulse-ring"
             style={{ background: 'rgba(0,200,255,0.1)', animationDelay: '0.4s' }} />
        <div className="relative w-28 h-28 rounded-full flex items-center justify-center animate-float"
             style={{ background: 'linear-gradient(135deg, #0f0f28 0%, #161640 100%)',
                      border: '2px solid rgba(0,255,135,0.4)',
                      boxShadow: '0 0 40px rgba(0,255,135,0.3), inset 0 0 20px rgba(0,255,135,0.05)' }}>
          <span className="text-5xl">🏆</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#00ff87' }}>
          ✦ PROFESYONEL ✦
        </p>
        <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
          Sports Edit
        </h1>
        <h2 className="text-5xl font-black leading-tight"
            style={{ background: 'linear-gradient(90deg, #00ff87, #00c8ff)',
                     WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Studio
        </h2>
        <p className="mt-4 text-base font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Efsane spor videoları oluştur 🎬
        </p>
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {['16 Efekt', '30 Müzik', 'Kişisel Süre', '1080×1920'].map((f) => (
          <span key={f} className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)',
                         color: '#00ff87' }}>
            {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleStart}
        className="w-full py-5 rounded-2xl text-xl font-black active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #00ff87, #00c8ff)',
                 color: '#080818',
                 boxShadow: '0 0 30px rgba(0,255,135,0.5)' }}
      >
        🎬 Video Oluştur
      </button>

      <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Can için yapıldı ⚽
      </p>
    </div>
  )
}
