import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useStore } from '../store/useStore'
import { db } from '../db/index'
import Layout from '../components/Layout'

function plotColor(pct) {
  if (pct === 0) return '#9ca3af'    // grey
  if (pct < 100) return '#f59e0b'    // yellow
  return '#16a34a'                    // green
}

export default function MapView() {
  const { trialId } = useParams()
  const navigate = useNavigate()
  const { trials, plots, loadPlots, trialTraits, loadTrialTraits } = useStore()
  const [obsCount, setObsCount] = useState({})

  const tid = parseInt(trialId)
  const trial = trials.find(t => t.id === tid)
  const trialPlots = plots.filter(p => p.trial_id === tid && p.lat && p.lng)

  useEffect(() => {
    loadPlots(tid)
    loadTrialTraits(tid)
  }, [tid])

  useEffect(() => {
    if (!plots.length) return
    const plotIds = plots.filter(p => p.trial_id === tid).map(p => p.id)
    db.observations.where('plot_id').anyOf(plotIds).toArray().then(obs => {
      const counts = {}
      obs.forEach(o => { counts[o.plot_id] = (counts[o.plot_id] || 0) + 1 })
      setObsCount(counts)
    })
  }, [plots, tid])

  const totalTraits = trialTraits.length

  const center = trialPlots.length > 0
    ? [
        trialPlots.reduce((s, p) => s + parseFloat(p.lat), 0) / trialPlots.length,
        trialPlots.reduce((s, p) => s + parseFloat(p.lng), 0) / trialPlots.length,
      ]
    : [30.0, 70.0]

  return (
    <Layout back={() => navigate(`/trial/${trialId}`)} title={trial?.name ?? 'Map'}>
      {trialPlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-500 text-sm">No plots with GPS coordinates yet.</p>
          <p className="text-gray-400 text-xs mt-1">Add GPS coordinates when creating or editing a plot.</p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-100 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />No data
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />Partial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />Complete
            </span>
          </div>

          <div style={{ height: 'calc(100svh - 180px)' }}>
            <MapContainer
              center={center}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {trialPlots.map(plot => {
                const count = obsCount[plot.id] || 0
                const pct = totalTraits > 0 ? Math.round((count / totalTraits) * 100) : 0
                const color = plotColor(pct)
                return (
                  <CircleMarker
                    key={plot.id}
                    center={[parseFloat(plot.lat), parseFloat(plot.lng)]}
                    radius={14}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[140px]">
                        <div className="font-bold text-gray-900 mb-0.5">{plot.name}</div>
                        <div className="text-gray-600 mb-1">{plot.variety}</div>
                        <div className="text-xs text-gray-400 mb-2">Rep {plot.rep} · {pct}% complete</div>
                        <button
                          onClick={() => navigate(`/plot/${plot.id}`)}
                          className="w-full bg-green-600 text-white text-xs py-1.5 rounded-lg font-medium"
                        >
                          Open Plot
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </>
      )}
    </Layout>
  )
}
