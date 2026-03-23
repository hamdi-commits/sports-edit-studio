import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

const MESSAGES = [
  'Adding effects...', 'Mixing the music...', 'Making it epic...',
  'Almost ready...', 'Final touches...'
]

export default function Rendering() {
  const navigate = useNavigate()
  const { jobId, jobStatus, jobProgress, setJobStatus, setJobProgress, setVideoUrl } = useAppStore()
  const intervalRef = useRef(null)
  const msgIndex = useRef(0)

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
          alert('Render failed: ' + (data.error || 'Unknown error'))
          navigate('/effects')
        }
      } catch {
        // ignore transient errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(intervalRef.current)
  }, [jobId])

  msgIndex.current = Math.min(Math.floor(jobProgress / 20), MESSAGES.length - 1)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-8">
      {/* Spinning ring */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-brand-purple/30" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-purple
                     animate-spin"
        />
        <div
          className="absolute inset-2 rounded-full border-4 border-transparent border-t-brand-pink
                     animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
        <span className="text-5xl animate-pulse">🎬</span>
      </div>

      <div>
        <h2 className="text-3xl font-black text-white">Rendering!</h2>
        <p className="text-xl text-brand-yellow mt-2 animate-flash">
          {MESSAGES[msgIndex.current]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-500"
          style={{ width: `${jobProgress}%` }}
        />
      </div>
      <p className="text-gray-400 text-lg font-bold">{Math.round(jobProgress)}%</p>
    </div>
  )
}
