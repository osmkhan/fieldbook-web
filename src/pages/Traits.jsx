import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { STAGE_LABELS } from '../db/cornTraits'
import Layout from '../components/Layout'

export default function Traits() {
  const { trialId } = useParams()
  const navigate = useNavigate()
  const { traits, trialTraits, loadTrialTraits, toggleTrialTrait, setTrialTraits } = useStore()

  const tid = parseInt(trialId)

  useEffect(() => { loadTrialTraits(tid) }, [tid])

  const grouped = {}
  traits.forEach(t => {
    const stage = t.stage || 'other'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(t)
  })

  const allIds = traits.map(t => t.id)
  const allSelected = allIds.every(id => trialTraits.includes(id))

  const toggleAll = () => {
    if (allSelected) {
      setTrialTraits(tid, [])
    } else {
      setTrialTraits(tid, allIds)
    }
  }

  return (
    <Layout back={() => navigate(-1)} title="Manage Traits"
      actions={
        <button onClick={toggleAll}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-medium">
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      }
    >
      <div className="px-4 py-4 space-y-6">
        <p className="text-sm text-gray-500">
          Toggle which traits are active for this trial. Active traits appear in data collection and export.
        </p>

        {Object.entries(grouped).map(([stage, stageTraits]) => (
          <div key={stage}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {STAGE_LABELS[stage] || stage}
              <span className="ml-2 text-gray-300 font-normal normal-case">
                {stageTraits.filter(t => trialTraits.includes(t.id)).length} / {stageTraits.length}
              </span>
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {stageTraits.map((trait, idx) => {
                const active = trialTraits.includes(trait.id)
                return (
                  <div
                    key={trait.id}
                    onClick={() => toggleTrialTrait(tid, trait.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 ${
                      idx < stageTraits.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {/* Toggle */}
                    <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
                      active ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        active ? 'left-5' : 'left-0.5'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{trait.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {trait.format}{trait.unit ? ` · ${trait.unit}` : ''}{trait.auto_calc ? ' · auto' : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="pb-4 text-center text-xs text-gray-400">
          {trialTraits.length} trait{trialTraits.length !== 1 ? 's' : ''} active
        </div>
      </div>
    </Layout>
  )
}
