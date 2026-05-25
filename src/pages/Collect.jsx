import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import TraitInput from '../components/TraitInput'

export default function Collect() {
  // trialId, startPlotId (0 = first), startTraitIdx
  const { trialId, plotId: startPlotIdStr, traitIdx: startTraitStr } = useParams()
  const navigate = useNavigate()

  const { trials, plots, traits, observations, loadPlots, loadObservations,
          loadAllObservations, loadTrialTraits, trialTraits, upsertObservation } = useStore()

  const [plotIdx, setPlotIdx] = useState(0)
  const [traitIdx, setTraitIdx] = useState(parseInt(startTraitStr) || 0)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const trial = trials.find(t => t.id === parseInt(trialId))
  const trialPlots = plots.filter(p => p.trial_id === parseInt(trialId))
  const activeTraits = traits.filter(t => trialTraits.includes(t.id))

  useEffect(() => {
    const tid = parseInt(trialId)
    loadPlots(tid).then(ps => {
      loadAllObservations(tid)
      loadTrialTraits(tid)
      if (startPlotIdStr && startPlotIdStr !== '0') {
        const idx = ps.findIndex(p => p.id === parseInt(startPlotIdStr))
        if (idx >= 0) setPlotIdx(idx)
      }
    })
  }, [trialId])

  const currentPlot = trialPlots[plotIdx]
  const currentTrait = activeTraits[traitIdx]

  // Load current value whenever plot/trait changes
  useEffect(() => {
    if (!currentPlot || !currentTrait) return
    const obs = observations.find(o => o.plot_id === currentPlot.id && o.trait_id === currentTrait.id)
    setValue(obs?.value ?? '')
    setSaved(false)
  }, [plotIdx, traitIdx, currentPlot?.id, currentTrait?.id])

  const save = useCallback(async (val) => {
    if (!currentPlot || !currentTrait) return
    setSaving(true)
    await upsertObservation(currentPlot.id, currentTrait.id, val ?? value)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [currentPlot, currentTrait, value])

  const goNext = useCallback(async () => {
    await save()
    if (traitIdx < activeTraits.length - 1) {
      setTraitIdx(t => t + 1)
    } else if (plotIdx < trialPlots.length - 1) {
      setPlotIdx(p => p + 1)
      setTraitIdx(0)
    } else {
      navigate(`/trial/${trialId}`)
    }
  }, [traitIdx, plotIdx, activeTraits.length, trialPlots.length, save])

  const goPrev = useCallback(() => {
    if (traitIdx > 0) {
      setTraitIdx(t => t - 1)
    } else if (plotIdx > 0) {
      setPlotIdx(p => p - 1)
      setTraitIdx(activeTraits.length - 1)
    }
  }, [traitIdx, plotIdx, activeTraits.length])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) goNext()
  }, [goNext])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!trial || activeTraits.length === 0 || trialPlots.length === 0) {
    return (
      <div className="min-h-svh bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-400 mb-4">
          {!activeTraits.length ? 'No active traits for this trial.' : 'No plots in this trial.'}
        </p>
        <button onClick={() => navigate(-1)}
          className="bg-green-600 px-6 py-3 rounded-xl font-semibold">
          Go Back
        </button>
      </div>
    )
  }

  const totalSteps = trialPlots.length * activeTraits.length
  const currentStep = plotIdx * activeTraits.length + traitIdx + 1
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  const isFirst = plotIdx === 0 && traitIdx === 0
  const isLast = plotIdx === trialPlots.length - 1 && traitIdx === activeTraits.length - 1

  return (
    <div className="min-h-svh bg-gray-900 text-white flex flex-col safe-top safe-bottom">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-xs text-white/50">
            Plot {plotIdx + 1} of {trialPlots.length} · Trait {traitIdx + 1} of {activeTraits.length}
          </div>
        </div>
        <div className="text-xs font-medium text-green-400">{progressPct}%</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 py-6 overflow-y-auto">
        {/* Plot info */}
        <div className="mb-6">
          <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Plot</div>
          <div className="text-xl font-bold">{currentPlot?.name}</div>
          <div className="text-green-400 text-sm mt-0.5">{currentPlot?.variety}</div>
        </div>

        {/* Trait */}
        <div className="mb-8">
          <div className="text-white/50 text-xs uppercase tracking-wide mb-1">
            {currentTrait?.stage?.replace('_', ' ')} · {currentTrait?.format}
          </div>
          <div className="text-2xl font-semibold mb-6">{currentTrait?.name}</div>
          {currentTrait && (
            <TraitInput
              trait={currentTrait}
              value={value}
              onChange={(v) => { setValue(v); setSaved(false) }}
            />
          )}
        </div>

        {/* Saved indicator */}
        {saved && (
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="px-4 pb-8 flex gap-3">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex-none w-14 h-14 rounded-2xl border border-white/20 flex items-center justify-center disabled:opacity-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => save(value)}
          className={`flex-none w-14 h-14 rounded-2xl border border-white/20 flex items-center justify-center transition-all ${
            saving ? 'opacity-50' : ''
          }`}
        >
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <button
          onClick={goNext}
          className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-500 font-semibold text-base flex items-center justify-center gap-2"
        >
          {isLast ? (
            <>Done</>
          ) : (
            <>
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
