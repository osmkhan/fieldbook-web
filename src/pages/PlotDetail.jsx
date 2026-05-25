import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { STAGE_LABELS } from '../db/cornTraits'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import TraitInput from '../components/TraitInput'

function calcAutoValue(trait, obsMap) {
  const get = (name) => obsMap[name]?.value

  if (trait.auto_calc === 'days_from_planting_to_tasseling') {
    const p = get('Planting Date'), t = get('Tasseling Date')
    if (p && t) return String(Math.round((new Date(t) - new Date(p)) / 86400000))
  }
  if (trait.auto_calc === 'days_from_planting_to_silking') {
    const p = get('Planting Date'), s = get('Silking Date')
    if (p && s) return String(Math.round((new Date(s) - new Date(p)) / 86400000))
  }
  if (trait.auto_calc === 'anthesis_silking_interval') {
    const a = get('Anthesis Date'), s = get('Silking Date')
    if (a && s) return String(Math.round((new Date(s) - new Date(a)) / 86400000))
  }
  if (trait.auto_calc === 'yield_t_ha') {
    const yieldKg = parseFloat(get('Final Yield per Plot'))
    const plot = obsMap.__plot
    const area = parseFloat(plot?.area_acres)
    if (!isNaN(yieldKg) && !isNaN(area) && area > 0) {
      const ha = area * 0.404686
      return (yieldKg / 1000 / ha).toFixed(2)
    }
  }
  return null
}

export default function PlotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const plotId = parseInt(id)
  const { plots, traits, observations, loadObservations, upsertObservation, trialTraits, loadTrialTraits } = useStore()
  const [editTrait, setEditTrait] = useState(null)
  const [editValue, setEditValue] = useState('')

  const plot = plots.find(p => p.id === plotId)

  useEffect(() => {
    loadObservations(plotId)
    if (plot) loadTrialTraits(plot.trial_id)
  }, [plotId, plot?.trial_id])

  if (!plot) return (
    <Layout back={() => navigate(-1)} title="Plot">
      <div className="p-4 text-gray-500">Plot not found.</div>
    </Layout>
  )

  const activeTraits = traits.filter(t => trialTraits.includes(t.id))
  const obsMap = {}
  observations.forEach(o => {
    const t = traits.find(tr => tr.id === o.trait_id)
    if (t) obsMap[t.name] = o
  })
  obsMap.__plot = plot

  const grouped = {}
  activeTraits.forEach(t => {
    const stage = t.stage || 'other'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(t)
  })

  const openEdit = (trait) => {
    const obs = obsMap[trait.name]
    setEditValue(obs?.value ?? calcAutoValue(trait, obsMap) ?? '')
    setEditTrait(trait)
  }

  const saveEdit = async () => {
    if (!editTrait) return
    await upsertObservation(plotId, editTrait.id, editValue)
    setEditTrait(null)
  }

  const obsCount = observations.filter(o => activeTraits.some(t => t.id === o.trait_id)).length

  return (
    <Layout
      back={() => navigate(-1)}
      title={plot.name}
      actions={
        <button
          onClick={() => navigate(`/collect/${plot.trial_id}/${plot.id}/0`)}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-medium"
        >
          Collect
        </button>
      }
    >
      {/* Plot header */}
      <div className="bg-green-700 text-white px-4 pb-4">
        <div className="text-green-200 text-sm">{plot.variety} · Rep {plot.rep}</div>
        {plot.area_acres && <div className="text-green-200 text-sm">{plot.area_acres} acres</div>}
        <div className="mt-2 text-sm">
          <span className="font-semibold">{obsCount}</span> / {activeTraits.length} traits recorded
        </div>
        <div className="mt-2 h-1.5 bg-green-900/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all"
            style={{ width: activeTraits.length ? `${Math.round(obsCount / activeTraits.length * 100)}%` : '0%' }}
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {Object.entries(grouped).map(([stage, stageTraits]) => (
          <div key={stage}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {STAGE_LABELS[stage] || stage}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {stageTraits.map((trait, idx) => {
                const obs = obsMap[trait.name]
                const autoVal = trait.auto_calc ? calcAutoValue(trait, obsMap) : null
                const displayVal = obs?.value ?? autoVal
                const isAuto = !obs?.value && autoVal

                return (
                  <div
                    key={trait.id}
                    onClick={() => !isAuto && openEdit(trait)}
                    className={`flex items-center justify-between px-4 py-3.5 gap-3 ${
                      idx < stageTraits.length - 1 ? 'border-b border-gray-100' : ''
                    } ${!isAuto ? 'cursor-pointer active:bg-gray-50' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{trait.name}</div>
                      {trait.unit && <div className="text-xs text-gray-400">{trait.unit}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      {displayVal ? (
                        <span className={`text-sm font-semibold ${isAuto ? 'text-blue-600' : 'text-gray-900'}`}>
                          {displayVal}{trait.unit && !['text','categorical','date','boolean','photo'].includes(trait.format) ? ` ${trait.unit}` : ''}
                          {isAuto && <span className="text-xs font-normal text-blue-400 ml-1">(auto)</span>}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {activeTraits.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No traits active for this trial.</p>
            <button
              onClick={() => navigate(`/trial/${plot.trial_id}/traits`)}
              className="mt-3 text-green-600 font-medium text-sm"
            >
              Manage Traits →
            </button>
          </div>
        )}
      </div>

      <Modal
        open={!!editTrait}
        onClose={() => setEditTrait(null)}
        title={editTrait?.name}
      >
        {editTrait && (
          <div className="space-y-6">
            <TraitInput trait={editTrait} value={editValue} onChange={setEditValue} />
            <div className="flex gap-3">
              <button onClick={() => setEditTrait(null)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700">
                Cancel
              </button>
              <button onClick={saveEdit}
                className="flex-1 py-3 bg-green-600 rounded-xl font-semibold text-white">
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
