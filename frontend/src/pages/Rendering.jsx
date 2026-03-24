import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

const MESSAGES = [
  'Fotoğraflar indiriliyor...',
  'Efektler uygulanıyor...',
  'Müzik karıştırılıyor...',
  'Epik hale getiriliyor...',
  'Son rötuşlar...',
]

export default function Rendering() {
  const navigate = useNavigate()
  const { jobId, jobProgress, setJobStatus, setJobProgress, setVideoUrl } = useAppStore()
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!jobId) { navigate('/search'); return }

    async function poll() {
      try {
        const { data } = await axios.get(`/api/render/${jobId}`)
        setJobStatus(data.status)
        setJobProgress(data.progress ?? 0)
        if (data.status === 'completed') {
          setVideoUrl(data.videoUrl)
          clearInterval(intervalRef.current)
          navigate('/video')
        } else if (data.status === 'failed') {
          clearInterval(intervalRef.current)
          alert('Render başarısız: ' + (data.error || 'Bilinmeyen hata'))
          navigate('/preview')
        }
      } catch {
        // ignore transient errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(intervalRef.current)
  }, [jobId])

  const msgIndex = Math.min(Math.floor(jobProgress / 20), MESSAGES.length - 1)
  const pct = Math.round(jobProgress)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-10"
         style={{ background: 'radial-gradient(ellipse at center, #0d0d30 0%, #080818 70%)' }}>

      {/* Spinner rings */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Outer ring - slow */}
        <div className="absolute inset-0 rounded-full animate-spin"
             style={{ border: '3px solid transparent',
                      borderTopColor: '#00ff87',
                      animationDuration: '2s' }} />
        {/* Middle ring - reverse */}
        <div className="absolute inset-4 rounded-full animate-spin"
             style={{ border: '3px solid transparent',
                      borderTopColor: '#00c8ff',
                      animationDirection: 'reverse',
                      animationDuration: '1.2s' }} />
        {/* Inner ring */}
        <div className="absolute inset-8 rounded-full animate-spin"
             style={{ border: '2px solid transparent',
                      borderTopColor: '#ff3366',
                      animationDuration: '0.8s' }} />
        {/* Center icon */}
        <span className="text-5xl animate-neon-pulse">🎬</span>
      </div>

      <div>
        <h2 className="text-3xl font-black text-white mb-2">Render Ediliyor!</h2>
        <p className="text-lg font-bold animate-flash" style={{ color: '#00ff87' }}>
          {MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="w-full h-3 rounded-full overflow-hidden mb-3"
             style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`,
                     background: 'linear-gradient(90deg, #00ff87, #00c8ff)',
                     boxShadow: '0 0 12px rgba(0,255,135,0.6)' }}
          />
        </div>
        <p className="font-black text-2xl" style={{ color: '#00ff87' }}>{pct}%</p>
      </div>

      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Sayfayı kapatma, işlem devam ediyor...
      </p>
    </div>
  )
}
