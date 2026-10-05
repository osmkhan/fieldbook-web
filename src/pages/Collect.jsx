import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { db, today, meanOf } from '../db/index'

/**
 * Collect — one plot at a time, showing only the traits chosen for this session.
 *
 * Navigation is plot-major: the trait set is fixed for the session, so the only
 * movement is between plots. Everything autosaves to IndexedDB on change.
 */
export default function Collect() {
  const { trialId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { trials, plots, traits, loadPlots } = useStore()

  const tid = parseInt(trialId)
  const trial = trials.find(t => t.id === tid)
  const traitIds = (params.get('traits') ?? '').split(',').filter(Boolean).map(Number)

  const [plotIdx, setPlotIdx] = useState(0)
  const [values, setValues] = useState({})     // traitId -> { value, readings, status }
  const [previous, setPrevious] = useState({}) // traitId -> last observation from an earlier date
  const [doneCount, setDoneCount] = useState(0)

  useEffect(() => { loadPlots(tid) }, [tid])

  const trialPlots = useMemo(
    () => plots.filter(p => p.trial_id === tid)
               .sort((a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id)),
    [plots, tid]
  )
  const sessionTraits = useMemo(
    () => traitIds.map(id => traits.find(t => t.id === id)).filter(Boolean),
    [traits, params.get('traits')]
  )
  const plot = trialPlots[plotIdx]

  // Load today's values + the most recent earlier reading for context.
  useEffect(() => {
    if (!plot) return
    let cancelled = false
    ;(async () => {
      const rows = await db.observations.where('plot_id').equals(plot.id).toArray()
      if (cancelled) return
      const t = today()
      const cur = {}, prev = {}
      for (const id of traitIds) {
        const mine = rows.filter(r => r.trait_id === id)
        const todays = mine.find(r => r.observed_on === t)
        if (todays) cur[id] = { value: todays.value, readings: todays.readings, status: todays.status }
        const earlier = mine.filter(r => r.observed_on !== t).sort((a, b) => b.observed_on.localeCompare(a.observed_on))[0]
        if (earlier) prev[id] = earlier
      }
      setValues(cur)
      setPrevious(prev)
    })()
    return () => { cancelled = true }
  }, [plot?.id, params.get('traits')])

  // How many plots have at least one of this session's traits recorded today.
  const refreshProgress = useCallback(async () => {
    if (!trialPlots.length) return
    const ids = trialPlots.map(p => p.id)
    const rows = await db.observations.where('plot_id').anyOf(ids).toArray()
    const t = today()
    const hit = new Set(
      rows.filter(r => r.observed_on === t && traitIds.includes(r.trait_id)).map(r => r.plot_id)
    )
    setDoneCount(hit.size)
  }, [trialPlots, params.get('traits')])

  useEffect(() => { refreshProgress() }, [refreshProgress, plotIdx])

  const save = useCallback(async (trait, patch) => {
    const next = { ...(values[trait.id] ?? {}), ...patch }
    setValues(v => ({ ...v, [trait.id]: next }))
    const value = trait.per_plant && next.readings?.length
      ? String(meanOf(next.readings) ?? '')
      : (next.value ?? '')
    await useStore.getState().saveObservation({
      plot_id: plot.id,
      trait_id: trait.id,
      value,
      readings: trait.per_plant ? (next.readings ?? null) : null,
      status: next.status ?? 'recorded',
    })
    refreshProgress()
  }, [values, plot?.id, refreshProgress])

  if (!trial)              return <Shell onBack={() => navigate('/')} msg="Trial not found." />
  if (!sessionTraits.length) return <Shell onBack={() => navigate(`/trial/${trialId}/record`)} msg="No traits selected for this session." />
  if (!plot)               return <Shell onBack={() => navigate(`/trial/${trialId}`)} msg="No plots in this trial yet." />

  const isLast = plotIdx === trialPlots.length - 1
  const pct = trialPlots.length ? Math.round((doneCount / trialPlots.length) * 100) : 0

  return (
    <div className="min-h-[100svh] flex flex-col bg-gray-50">
      {/* Header — plot identity is the biggest thing on screen */}
      <header className="bg-green-800 text-white px-4 pt-3 pb-3 sticky top-0 z-20">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(`/trial/${trialId}`)} aria-label="Back"
            className="p-2 -ml-2 -mt-1 active:bg-white/20 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight truncate">{plot.name || `Plot ${plotIdx + 1}`}</h1>
            <p className="text-sm text-green-100 truncate">
              {plot.variety || 'No variety'}{plot.rep ? ` · Rep ${plot.rep}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold tabular-nums">{plotIdx + 1}</div>
            <div className="text-xs text-green-200">of {trialPlots.length}</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-green-900/50 rounded-full overflow-hidden">
          <div className="h-full bg-green-300 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-green-200 mt-1">{doneCount} of {trialPlots.length} plots done today</p>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-4">
        {sessionTraits.map(trait => (
          <TraitCard
            key={trait.id}
            trait={trait}
            state={values[trait.id]}
            previous={previous[trait.id]}
            onChange={patch => save(trait, patch)}
          />
        ))}
      </main>

      {/* Navigation — thumb zone */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-3 py-3 flex gap-3 safe-bottom">
        <button
          onClick={() => setPlotIdx(i => Math.max(0, i - 1))}
          disabled={plotIdx === 0}
          className="w-28 py-4 rounded-2xl bg-gray-100 disabled:opacity-40 text-gray-700 font-bold text-base active:bg-gray-200"
        >
          ← Back
        </button>
        <button
          onClick={() => isLast ? navigate(`/trial/${trialId}`) : setPlotIdx(i => i + 1)}
          className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-bold text-lg active:bg-green-700"
        >
          {isLast ? 'Finish' : 'Next plot →'}
        </button>
      </footer>
    </div>
  )
}

function Shell({ onBack, msg }) {
  return (
    <div className="min-h-[100svh] bg-gray-50">
      <header className="bg-green-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Collect</h1>
      </header>
      <p className="p-6 text-gray-600">{msg}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function TraitCard({ trait, state, previous, onChange }) {
  const isNA = state?.status === 'na'
  const outOfRange =
    trait.format === 'numeric' && state?.value !== '' && state?.value != null &&
    ((trait.min != null && Number(state.value) < trait.min) ||
     (trait.max != null && Number(state.value) > trait.max))

  return (
    <section className={`rounded-2xl border shadow-sm overflow-hidden ${isNA ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-baseline gap-2 px-4 pt-3.5 pb-2">
        <h2 className="text-lg font-bold text-gray-900 flex-1 leading-tight">{trait.name}</h2>
        {trait.unit && <span className="text-sm text-gray-500 shrink-0">{trait.unit}</span>}
      </div>

      {previous && (
        <p className="px-4 -mt-1 pb-2 text-xs text-amber-700">
          Last time: <span className="font-semibold">{previous.status === 'na' ? 'NA' : previous.value}</span>
          {' '}on {previous.observed_on}
        </p>
      )}

      {!isNA && (
        <div className="px-4 pb-3">
          {trait.per_plant
            ? <ReadingsInput trait={trait} state={state} onChange={onChange} />
            : <SingleInput   trait={trait} state={state} onChange={onChange} />}
          {outOfRange && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Outside the usual range ({trait.min ?? '–'}–{trait.max ?? '–'} {trait.unit}). Saved anyway.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/70">
        <button
          onClick={() => onChange(isNA
            ? { status: 'recorded' }
            : { status: 'na', value: 'NA', readings: null })}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${
            isNA ? 'bg-gray-700 text-white' : 'bg-white border-2 border-gray-300 text-gray-600 active:bg-gray-100'
          }`}
        >
          {isNA ? 'NA — tap to undo' : 'NA'}
        </button>
        <span className="text-xs text-gray-400 flex-1 text-right">
          {isNA ? 'Checked, not available' : 'Saves automatically'}
        </span>
      </div>
    </section>
  )
}

function SingleInput({ trait, state, onChange }) {
  const v = state?.value ?? ''

  if (trait.format === 'categorical') {
    return (
      <div className="flex flex-wrap gap-2">
        {trait.categories.map(c => (
          <button
            key={c}
            onClick={() => onChange({ value: v === c ? '' : c })}
            className={`px-4 py-3 rounded-xl text-base font-semibold border-2 ${
              v === c ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-700 active:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    )
  }

  if (trait.format === 'date') {
    return (
      <div className="flex gap-2">
        <input
          type="date" value={v}
          onChange={e => onChange({ value: e.target.value })}
          className="flex-1 border-2 border-gray-300 rounded-xl px-3 py-3 text-lg focus:border-green-600 outline-none"
        />
        <button
          onClick={() => onChange({ value: today() })}
          className="px-4 py-3 rounded-xl bg-green-600 text-white font-bold active:bg-green-700"
        >
          Today
        </button>
      </div>
    )
  }

  if (trait.format === 'text') {
    return (
      <textarea
        rows={3} value={v}
        onChange={e => onChange({ value: e.target.value })}
        placeholder="Type here…"
        className="w-full border-2 border-gray-300 rounded-xl px-3 py-3 text-base focus:border-green-600 outline-none"
      />
    )
  }

  // numeric
  return (
    <input
      type="number" inputMode="decimal" value={v}
      onChange={e => onChange({ value: e.target.value })}
      placeholder="—"
      className="w-full border-2 border-gray-300 rounded-xl px-4 py-4 text-3xl font-bold tabular-nums text-center focus:border-green-600 outline-none"
    />
  )
}

/** Per-plant traits: keep every individual reading, show the running mean. */
function ReadingsInput({ trait, state, onChange }) {
  const readings = state?.readings ?? []
  const [draft, setDraft] = useState('')

  const add = () => {
    const n = parseFloat(draft)
    if (isNaN(n)) return
    onChange({ readings: [...readings, n] })
    setDraft('')
  }
  const remove = i => onChange({ readings: readings.filter((_, j) => j !== i) })

  const mean = meanOf(readings)

  return (
    <div>
      {readings.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {readings.map((r, i) => (
            <button
              key={i} onClick={() => remove(i)}
              className="px-3 py-2 rounded-lg bg-green-50 border-2 border-green-200 text-green-900 font-bold tabular-nums text-base flex items-center gap-1.5 active:bg-green-100"
            >
              {r}
              <span className="text-green-400 text-lg leading-none">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="number" inputMode="decimal" value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={`Plant ${readings.length + 1}`}
          className="flex-1 min-w-0 border-2 border-gray-300 rounded-xl px-3 py-3.5 text-2xl font-bold tabular-nums text-center focus:border-green-600 outline-none"
        />
        <button
          onClick={add} disabled={draft === ''}
          className="w-16 shrink-0 rounded-xl bg-green-600 disabled:bg-gray-300 text-white text-3xl font-bold active:bg-green-700"
          aria-label="Add reading"
        >
          +
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {readings.length === 0
          ? <span className="text-gray-400">Measure a few plants and add each one.</span>
          : <>Average <span className="font-bold text-gray-900 text-base">{mean}</span>
             {trait.unit ? ` ${trait.unit}` : ''} · {readings.length} plant{readings.length === 1 ? '' : 's'}</>}
      </p>
    </div>
  )
}
