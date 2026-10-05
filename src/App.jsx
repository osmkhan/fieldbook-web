import { useEffect, useState } from 'react'
// HashRouter, not BrowserRouter: this ships as static files to a subpath and is
// reopened offline from the home screen. Hash routes need no server rewrites,
// no 404 fallback, and survive being served from any directory.
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store/useStore'
import Home from './pages/Home'
import TrialDetail from './pages/TrialDetail'
import PlotDetail from './pages/PlotDetail'
import Collect from './pages/Collect'
import Traits from './pages/Traits'
import GlobalTraits from './pages/GlobalTraits'
import Export from './pages/Export'
import MapView from './pages/MapView'
import Analysis from './pages/Analysis'
import Session from './pages/Session'

export default function App() {
  // Load trials + traits once, at the top. Every page needs them, and an
  // installed PWA can be reopened or refreshed on any route — not just Home.
  const [ready, setReady] = useState(false)
  useEffect(() => { useStore.getState().init().finally(() => setReady(true)) }, [])

  if (!ready) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trial/:id" element={<TrialDetail />} />
        <Route path="/trial/:trialId/traits" element={<Traits />} />
        <Route path="/trial/:trialId/export" element={<Export />} />
        <Route path="/trial/:trialId/map" element={<MapView />} />
        <Route path="/trial/:trialId/analysis" element={<Analysis />} />
        <Route path="/trial/:trialId/record" element={<Session />} />
        <Route path="/plot/:id" element={<PlotDetail />} />
        <Route path="/collect/:trialId" element={<Collect />} />
        <Route path="/traits" element={<GlobalTraits />} />
      </Routes>
    </HashRouter>
  )
}
