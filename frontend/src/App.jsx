import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AthleteSearch from './pages/AthleteSearch.jsx'
import PhotoPreview from './pages/PhotoPreview.jsx'
import EffectSelection from './pages/EffectSelection.jsx'
import MusicSelection from './pages/MusicSelection.jsx'
import Rendering from './pages/Rendering.jsx'
import VideoPreview from './pages/VideoPreview.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col max-w-md mx-auto relative">
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/search"         element={<AthleteSearch />} />
        <Route path="/preview"        element={<PhotoPreview />} />
        <Route path="/effects"        element={<EffectSelection />} />
        <Route path="/music"          element={<MusicSelection />} />
        <Route path="/rendering"      element={<Rendering />} />
        <Route path="/video"          element={<VideoPreview />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
