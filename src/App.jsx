import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TrialDetail from './pages/TrialDetail'
import PlotDetail from './pages/PlotDetail'
import Collect from './pages/Collect'
import Traits from './pages/Traits'
import GlobalTraits from './pages/GlobalTraits'
import Export from './pages/Export'
import MapView from './pages/MapView'
import Analysis from './pages/Analysis'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trial/:id" element={<TrialDetail />} />
        <Route path="/trial/:trialId/traits" element={<Traits />} />
        <Route path="/trial/:trialId/export" element={<Export />} />
        <Route path="/trial/:trialId/map" element={<MapView />} />
        <Route path="/trial/:trialId/analysis" element={<Analysis />} />
        <Route path="/plot/:id" element={<PlotDetail />} />
        <Route path="/collect/:trialId/:plotId/:traitIdx" element={<Collect />} />
        <Route path="/traits" element={<GlobalTraits />} />
      </Routes>
    </BrowserRouter>
  )
}
