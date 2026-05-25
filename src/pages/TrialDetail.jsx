import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { db } from '../db/index'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

function PlotForm({ initial, trialId, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    trial_id: trialId,
    name: '', variety: '', rep: 1,
    area_acres: '', lat: '', lng: '',
    planting_date: '', notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const captureGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      set('lat', pos.coords.latitude.toFixed(6))
      set('lng', pos.coords.longitude.toFixed(6))
    })
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plot Name *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="A-1" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rep #</label>
          <input type="number" min={1} value={form.rep} onChange={e => set('rep', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Variety *</label>
        <input required value={form.variety} onChange={e => set('variety', e.target.value)}
          placeholder="e.g. Pioneer 30Y87"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Area (acres)</label>
        <input type="number" step="0.01" value={form.area_acres} onChange={e => set('area_acres', e.target.value)}
          placeholder="0.5"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">GPS Coordinates</label>
          <button type="button" onClick={captureGPS}
            className="text-xs text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use my location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)}
            placeholder="Latitude" className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
          <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)}
            placeholder="Longitude" className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
        <input type="date" value={form.planting_date} onChange={e => set('planting_date', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">Cancel</button>
        <button type="submit"
          className="flex-1 py-2.5 bg-green-600 rounded-xl text-sm font-semibold text-white">
          {initial ? 'Save' : 'Add Plot'}
        </button>
      </div>
    </form>
  )
}

export default function TrialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trials, plots, loadPlots, addPlot, updatePlot, deletePlot, trialTraits, loadTrialTraits } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editPlot, setEditPlot] = useState(null)
  const [obsCount, setObsCount] = useState({})

  const trial = trials.find(t => t.id === parseInt(id))

  useEffect(() => {
    loadPlots(parseInt(id))
    loadTrialTraits(parseInt(id))
  }, [id])

  useEffect(() => {
    if (!plots.length) return
    const plotIds = plots.map(p => p.id)
    db.observations.where('plot_id').anyOf(plotIds).toArray().then(obs => {
      const counts = {}
      obs.forEach(o => { counts[o.plot_id] = (counts[o.plot_id] || 0) + 1 })
      setObsCount(counts)
    })
  }, [plots])

  if (!trial) return <Layout back={() => navigate('/')} title="Trial"><div className="p-4 text-gray-500">Trial not found.</div></Layout>

  const totalTraits = trialTraits.length
  const trialPlots = plots.filter(p => p.trial_id === parseInt(id))

  const completeness = (plotId) => {
    if (!totalTraits) return 0
    return Math.round(((obsCount[plotId] || 0) / totalTraits) * 100)
  }

  const statusColor = (pct) => {
    if (pct === 0) return 'bg-gray-200 text-gray-600'
    if (pct < 100) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <Layout
      back={() => navigate('/')}
      title={trial.name}
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate(`/trial/${id}/traits`)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-medium">
            Traits
          </button>
          <button onClick={() => navigate(`/trial/${id}/export`)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-medium">
            Export
          </button>
        </div>
      }
    >
      {/* Trial summary */}
      <div className="bg-green-700 text-white px-4 pb-4 -mt-0">
        <div className="text-sm text-green-200">
          {trial.crop} · {trial.season} {trial.year} · {trial.design_type}
        </div>
        <div className="mt-2 text-sm">
          <span className="font-semibold">{trialPlots.length}</span> plots ·{' '}
          <span className="font-semibold">{totalTraits}</span> active traits
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Collect all button */}
        {trialPlots.length > 0 && totalTraits > 0 && (
          <button
            onClick={() => navigate(`/collect/${id}/0/0`)}
            className="w-full bg-green-600 text-white py-3.5 rounded-2xl font-semibold text-base shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Start Data Collection
          </button>
        )}

        {trialPlots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No plots yet. Add your first plot.</p>
            <button onClick={() => setShowAdd(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">
              Add Plot
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900">Plots</h2>
              <button onClick={() => setShowAdd(true)}
                className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Plot
              </button>
            </div>
            {trialPlots.map(plot => {
              const pct = completeness(plot.id)
              return (
                <div
                  key={plot.id}
                  onClick={() => navigate(`/plot/${plot.id}`)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{plot.name}</span>
                        <span className="text-xs text-gray-400">Rep {plot.rep}</span>
                      </div>
                      <div className="text-sm text-gray-500 truncate mt-0.5">{plot.variety}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${statusColor(pct)}`}>
                      {pct}%
                    </span>
                  </div>
                  {/* progress bar */}
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-gray-200'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>{obsCount[plot.id] || 0} / {totalTraits} traits</span>
                    {plot.lat && plot.lng && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        GPS
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Plot">
        <PlotForm trialId={parseInt(id)} onSave={async (form) => { await addPlot(form); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editPlot} onClose={() => setEditPlot(null)} title="Edit Plot">
        {editPlot && (
          <PlotForm
            initial={editPlot}
            trialId={parseInt(id)}
            onSave={async (form) => { await updatePlot(editPlot.id, form); setEditPlot(null) }}
            onCancel={() => setEditPlot(null)}
          />
        )}
      </Modal>
    </Layout>
  )
}
