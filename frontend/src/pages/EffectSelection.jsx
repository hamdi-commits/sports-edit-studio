import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore.js'

const EFFECTS = [
  {
    id: 'ken_burns',
    name: 'Ken Burns',
    emoji: '🎥',
    description: 'Smooth zoom & pan',
    gradient: 'from-blue-600 to-cyan-400',
  },
  {
    id: 'zoom_burst',
    name: 'Zoom Burst',
    emoji: '💥',
    description: 'Explosive zoom-in!',
    gradient: 'from-orange-500 to-yellow-400',
  },
  {
    id: 'flash_cut',
    name: 'Flash Cut',
    emoji: '⚡',
    description: 'Fast cuts + white flash',
    gradient: 'from-pink-600 to-purple-500',
  },
]

export default function EffectSelection() {
  const navigate = useNavigate()
  const { selectedEffect, setSelectedEffect } = useAppStore()

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-14 pb-4 sticky top-0 bg-brand-dark z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/preview')} className="text-2xl">←</button>
          <h2 className="text-xl font-black">Pick an Effect</h2>
        </div>
      </div>

      <div className="flex-1 px-4 pb-32 flex flex-col gap-4 mt-4">
        {EFFECTS.map((effect) => {
          const selected = selectedEffect === effect.id
          return (
            <button
              key={effect.id}
              onClick={() => setSelectedEffect(effect.id)}
              className={`w-full p-6 rounded-3xl text-left flex items-center gap-4 transition-all active:scale-95
                          border-4 ${selected ? 'border-brand-yellow scale-95 shadow-xl shadow-yellow-500/30' : 'border-transparent'}
                          bg-gradient-to-r ${effect.gradient}`}
            >
              <span className="text-5xl">{effect.emoji}</span>
              <div>
                <p className="text-2xl font-black text-white">{effect.name}</p>
                <p className="text-white/80 text-base">{effect.description}</p>
              </div>
              {selected && <span className="ml-auto text-3xl">✅</span>}
            </button>
          )
        })}
      </div>

      {selectedEffect && (
        <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6">
          <button
            onClick={() => navigate('/music')}
            className="w-full py-5 rounded-3xl text-2xl font-black bg-gradient-to-r from-brand-yellow to-brand-pink
                       text-black active:scale-95 transition-transform"
          >
            Pick Music →
          </button>
        </div>
      )}
    </div>
  )
}
