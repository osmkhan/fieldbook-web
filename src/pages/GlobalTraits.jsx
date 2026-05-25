import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { STAGE_LABELS } from '../db/cornTraits'
import Layout from '../components/Layout'

export default function GlobalTraits() {
  const { traits, trials, init } = useStore()
  const navigate = useNavigate()

  useEffect(() => { init() }, [])

  const grouped = {}
  traits.forEach(t => {
    const stage = t.stage || 'other'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(t)
  })

  return (
    <Layout title="Trait Library">
      <div className="px-4 py-4 space-y-6">
        {trials.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-sm text-green-800 font-medium mb-3">Manage traits per trial:</p>
            <div className="space-y-2">
              {trials.map(trial => (
                <button
                  key={trial.id}
                  onClick={() => navigate(`/trial/${trial.id}/traits`)}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-green-200 hover:border-green-400 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{trial.name}</div>
                    <div className="text-xs text-gray-500">{trial.crop} · {trial.season} {trial.year}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          {traits.length} traits in library · corn (default)
        </p>

        {Object.entries(grouped).map(([stage, stageTraits]) => (
          <div key={stage}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {STAGE_LABELS[stage] || stage}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {stageTraits.map((trait, idx) => (
                <div
                  key={trait.id}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    idx < stageTraits.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{trait.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {trait.format}{trait.unit ? ` · ${trait.unit}` : ''}{trait.auto_calc ? ' · auto-calculated' : ''}
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full capitalize">
                    {trait.stage?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
