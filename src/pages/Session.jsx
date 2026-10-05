import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { STAGE_LABELS, stageFromDap } from '../db/cornTraits'
import Layout from '../components/Layout'

/**
 * "What are you recording today?" — the user picks a handful of traits once,
 * then Collect is a flat walk through plots showing only those.
 *
 * This is also what makes the app work for either field habit: pick one trait
 * and it's a single-trait pass across every plot; pick six and it's everything
 * at one plot before moving on. The user's choice decides, not a hardcoded flow.
 */
export default function Session() {
  const { trialId } = useParams()
  const navigate = useNavigate()
  const { trials, plots, traits, loadPlots, trialTraits, loadTrialTraits } = useStore()
  const tid = parseInt(trialId)
  const trial = trials.find(t => t.id === tid)
  const [selected, setSelected] = useState([])

  useEffect(() => { loadPlots(tid); loadTrialTraits(tid) }, [tid])

  const trialPlots = plots.filter(p => p.trial_id === tid)

  // Days after planting — earliest planting date across the trial's plots.
  const dap = useMemo(() => {
    const dates = trialPlots.map(p => p.planting_date).filter(Boolean).sort()
    if (!dates.length) return null
    return Math.floor((Date.now() - new Date(dates[0]).getTime()) / 86400000)
  }, [trialPlots])

  // Offer the trial's active traits; fall back to the whole library if none chosen.
  const available = useMemo(() => {
    const pool = trialTraits.length
      ? traits.filter(t => trialTraits.includes(t.id))
      : traits
    return pool.filter(t => !t.auto_calc)   // calculated traits aren't entered by hand
  }, [traits, trialTraits])

  const suggested = useMemo(() => {
    if (dap == null) return []
    return available.filter(t => t.dap && dap >= t.dap[0] && dap <= t.dap[1])
  }, [available, dap])

  // Deliberately nothing is pre-ticked. A session is meant to be two or three
  // traits; pre-selecting everything that *could* be due turns picking into
  // unpicking, which is more work than it saves.

  const toggle = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const others = available.filter(t => !suggested.some(s => s.id === t.id))
  const grouped = others.reduce((acc, t) => {
    (acc[t.stage] ??= []).push(t); return acc
  }, {})

  const start = () => {
    if (!selected.length) return
    navigate(`/collect/${trialId}?traits=${selected.join(',')}`)
  }

  const Row = ({ t }) => {
    const on = selected.includes(t.id)
    return (
      <button
        onClick={() => toggle(t.id)}
        className={`w-full flex items-center gap-3 px-4 py-4 text-left border-b border-gray-100 active:bg-gray-50 ${on ? 'bg-green-50' : 'bg-white'}`}
      >
        <span className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 ${
          on ? 'bg-green-600 border-green-600' : 'border-gray-300'
        }`}>
          {on && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className="flex-1">
          <span className="block text-base font-medium text-gray-900">{t.name}</span>
          {(t.unit || t.per_plant) && (
            <span className="block text-xs text-gray-500 mt-0.5">
              {t.unit}{t.unit && t.per_plant ? ' · ' : ''}{t.per_plant ? 'per plant' : ''}
            </span>
          )}
        </span>
      </button>
    )
  }

  if (!trial) return <Layout back={() => navigate('/')} title="Record"><div className="p-4 text-gray-500">Trial not found.</div></Layout>

  return (
    <Layout back={() => navigate(`/trial/${trialId}`)} title="What are you recording?" hideNav>
      <div className="pb-32">
        {dap != null && (
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <p className="text-sm text-green-900 font-semibold">{stageFromDap(dap)}</p>
            <p className="text-xs text-green-700 mt-0.5">
              {dap} days after planting · {trialPlots.length} plots
            </p>
          </div>
        )}

        {suggested.length > 0 && (
          <>
            <h2 className="px-4 pt-5 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
              Due now
            </h2>
            {suggested.map(t => <Row key={t.id} t={t} />)}
          </>
        )}

        {Object.entries(grouped).map(([stage, list]) => (
          <div key={stage}>
            <h2 className="px-4 pt-5 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
              {STAGE_LABELS[stage] ?? stage}
            </h2>
            {list.map(t => <Row key={t.id} t={t} />)}
          </div>
        ))}

        {available.length === 0 && (
          <p className="p-6 text-center text-gray-500">No traits available. Add some on the Traits screen.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
        <button
          onClick={start}
          disabled={!selected.length || !trialPlots.length}
          className="w-full bg-green-600 disabled:bg-gray-300 text-white text-lg font-bold py-4 rounded-2xl active:bg-green-700"
        >
          {trialPlots.length === 0
            ? 'Add a plot first'
            : selected.length
              ? `Start — ${selected.length} ${selected.length === 1 ? 'trait' : 'traits'}`
              : 'Pick at least one'}
        </button>
      </div>
    </Layout>
  )
}
