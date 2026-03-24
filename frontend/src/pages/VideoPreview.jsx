import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore.js'

export default function VideoPreview() {
  const navigate = useNavigate()
  const { videoUrl, athleteName, reset } = useAppStore()
  const [copied, setCopied] = useState(false)

  if (!videoUrl) {
    navigate('/')
    return null
  }

  const year = new Date().getFullYear()
  const safeAthlete = athleteName || 'Sporcu'
  const suggestedTitle = `${safeAthlete} - Epic Sports Edit 🔥 | ${year}`
  const suggestedTags = `#${safeAthlete.replace(/\s+/g, '')} #SportsEdit #Highlights #Football #Sports #Edit`

  function handleDownload() {
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${safeAthlete.replace(/\s+/g, '_')}-edit.mp4`
    a.click()
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: suggestedTitle, url: videoUrl }).catch(() => {})
    } else {
      handleDownload()
    }
  }

  function handleCopyText() {
    const text = `${suggestedTitle}\n\n${suggestedTags}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleNew() {
    reset()
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10"
           style={{ background: 'rgba(8,8,24,0.95)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(0,255,135,0.08)' }}>
        <h2 className="text-xl font-black text-center text-white">
          Video Hazır! 🎉
        </h2>
      </div>

      <div className="flex-1 flex flex-col gap-4 px-4 pb-8 mt-4 overflow-y-auto no-scrollbar">

        {/* Video player */}
        <div className="w-full rounded-2xl overflow-hidden"
             style={{ background: '#000',
                      border: '1px solid rgba(0,255,135,0.25)',
                      boxShadow: '0 0 30px rgba(0,255,135,0.2)' }}>
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            playsInline
            className="w-full"
            style={{ aspectRatio: '9/16' }}
          />
        </div>

        {/* Download / Share */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #00ff87, #00c8ff)',
                     color: '#080818',
                     boxShadow: '0 0 20px rgba(0,255,135,0.4)' }}
          >
            ⬇️ Kaydet
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
            style={{ background: '#161640', color: 'white',
                     border: '1px solid rgba(0,200,255,0.3)',
                     boxShadow: '0 0 12px rgba(0,200,255,0.2)' }}
          >
            📤 Paylaş
          </button>
        </div>

        {/* YouTube Studio button */}
        <a
          href="https://studio.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 rounded-2xl font-black text-base text-center flex items-center justify-center gap-2
                     active:scale-95 transition-all"
          style={{ background: 'rgba(255,0,0,0.15)',
                   border: '1px solid rgba(255,0,0,0.4)',
                   color: '#ff4444',
                   boxShadow: '0 0 16px rgba(255,0,0,0.2)' }}
        >
          <span className="text-xl">▶</span>
          YouTube Studio'da Aç
        </a>

        {/* Title + Tags card */}
        <div className="p-4 rounded-2xl"
             style={{ background: '#0f0f28', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black tracking-wider" style={{ color: '#ffd700' }}>
              ÖNERİLEN BAŞLIK & ETİKETLER
            </p>
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg text-xs font-black active:scale-95 transition-all"
              style={copied
                ? { background: 'rgba(0,255,135,0.2)', color: '#00ff87',
                    border: '1px solid rgba(0,255,135,0.4)' }
                : { background: '#161640', color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {copied ? '✓ Kopyalandı!' : '📋 Kopyala'}
            </button>
          </div>
          <p className="text-sm font-bold text-white mb-2">{suggestedTitle}</p>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)',
                                                         wordBreak: 'break-all' }}>
            {suggestedTags}
          </p>
        </div>

        {/* Make another */}
        <button
          onClick={handleNew}
          className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
          style={{ background: '#161640', color: 'rgba(255,255,255,0.7)',
                   border: '1px solid rgba(255,255,255,0.08)' }}
        >
          🔄 Yeni Video Yap
        </button>
      </div>
    </div>
  )
}
