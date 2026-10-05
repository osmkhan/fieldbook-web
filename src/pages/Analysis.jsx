import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { useStore } from '../store/useStore'
import { db } from '../db/index'
import Layout from '../components/Layout'

const CHART_COLORS = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2','#65a30d','#c2410c']

const KEY_NUMERIC_TRAITS = [
  'Final Yield per Plot',
  'Yield (t/ha)',
  'Plant Height',
  'Days to Silk',
  'Days to Tassel',
  'ASI',
  'Ear Length',
  'Ear Diameter',
  '100-Kernel Weight',
  'Grain Moisture at Harvest',
  'Plant Stand Count',
  'Germination %',
]

function calcAutoValue(traitName, obsMap) {
  const get = (name) => obsMap[name]
  if (traitName === 'Days to Tassel') {
    const p = get('Planting Date'), t = get('Tasseling Date')
    if (p && t) return Math.round((new Date(t) - new Date(p)) / 86400000)
  }
  if (traitName === 'Days to Silk') {
    const p = get('Planting Date'), s = get('Silking Date')
    if (p && s) return Math.round((new Date(s) - new Date(p)) / 86400000)
  }
  if (traitName === 'ASI') {
    const a = get('Anthesis Date'), s = get('Silking Date')
    if (a && s) return Math.round((new Date(s) - new Date(a)) / 86400000)
  }
  return null
}

export default function Analysis() {
  const { trialId } = useParams()
  const navigate = useNavigate()
  const { trials, plots, loadPlots } = useStore()
  const [allObs, setAllObs] = useState([])
  const [allTraits, setAllTraits] = useState([])
  const [selectedTrait, setSelectedTrait] = useState('Final Yield per Plot')
  const [sortBy, setSortBy] = useState('variety')
  const [sortDir, setSortDir] = useState('asc')

  const tid = parseInt(trialId)
  const trial = trials.find(t => t.id === tid)

  useEffect(() => {
    const load = async () => {
      await loadPlots(tid)
      const ps = await db.plots.where('trial_id').equals(tid).toArray()
      const plotIds = ps.map(p => p.id)
      const [obs, traits] = await Promise.all([
        db.observations.where('plot_id').anyOf(plotIds).toArray(),
        db.traits.toArray(),
      ])
      setAllObs(obs)
      setAllTraits(traits)
    }
    load()
  }, [tid])

  const trialPlots = plots.filter(p => p.trial_id === tid)

  // Build per-plot observation map: { plotId: { traitName: value } }
  const plotObsMap = useMemo(() => {
    const traitById = Object.fromEntries(allTraits.map(t => [t.id, t]))
    const map = {}
    // Oldest first, so a trait measured several times leaves the latest value.
    const ordered = [...allObs].sort((a, b) => (a.observed_on ?? '').localeCompare(b.observed_on ?? ''))
    ordered.forEach(o => {
      const trait = traitById[o.trait_id]
      if (!trait) return
      if (!map[o.plot_id]) map[o.plot_id] = {}
      map[o.plot_id][trait.name] = o.value
    })
    // Fill auto-calculated values
    trialPlots.forEach(plot => {
      const obs = map[plot.id] || {}
      for (const name of ['Days to Tassel', 'Days to Silk', 'ASI']) {
        if (!obs[name]) {
          const v = calcAutoValue(name, obs)
          if (v !== null) obs[name] = String(v)
        }
      }
      map[plot.id] = obs
    })
    return map
  }, [allObs, allTraits, trialPlots])

  // Available numeric traits that have at least one value
  const availableTraits = useMemo(() => {
    return KEY_NUMERIC_TRAITS.filter(name =>
      trialPlots.some(p => {
        const v = plotObsMap[p.id]?.[name]
        return v && !isNaN(parseFloat(v))
      })
    )
  }, [plotObsMap, trialPlots])

  // Chart data: average value per variety for selected trait
  const chartData = useMemo(() => {
    const byVariety = {}
    trialPlots.forEach(plot => {
      const v = plotObsMap[plot.id]?.[selectedTrait]
      if (!v || isNaN(parseFloat(v))) return
      const variety = plot.variety || `Plot ${plot.name}`
      if (!byVariety[variety]) byVariety[variety] = { sum: 0, count: 0 }
      byVariety[variety].sum += parseFloat(v)
      byVariety[variety].count += 1
    })
    return Object.entries(byVariety)
      .map(([variety, { sum, count }]) => ({
        variety,
        value: parseFloat((sum / count).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
  }, [plotObsMap, trialPlots, selectedTrait])

  // Summary table: one row per plot
  const TABLE_COLS = availableTraits.length > 0 ? availableTraits.slice(0, 5) : KEY_NUMERIC_TRAITS.slice(0, 5)

  const tableRows = useMemo(() => {
    return trialPlots.map(plot => ({
      plot,
      values: Object.fromEntries(
        TABLE_COLS.map(name => [name, plotObsMap[plot.id]?.[name] ?? '—'])
      ),
    }))
  }, [trialPlots, plotObsMap, TABLE_COLS])

  const sortedRows = useMemo(() => {
    return [...tableRows].sort((a, b) => {
      let av, bv
      if (sortBy === 'variety') {
        av = a.plot.variety ?? ''
        bv = b.plot.variety ?? ''
      } else if (sortBy === 'plot') {
        av = a.plot.name ?? ''
        bv = b.plot.name ?? ''
      } else {
        av = parseFloat(a.values[sortBy]) || 0
        bv = parseFloat(b.values[sortBy]) || 0
      }
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [tableRows, sortBy, sortDir])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const traitUnit = allTraits.find(t => t.name === selectedTrait)?.unit

  return (
    <Layout back={() => navigate(`/trial/${trialId}`)} title="Analysis">
      <div className="px-4 py-4 space-y-6">

        {availableTraits.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-medium text-gray-500">No numeric data collected yet.</p>
            <p className="text-sm mt-1">Record some observations to see charts here.</p>
          </div>
        ) : (
          <>
            {/* Trait selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Trait to compare
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTraits.map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedTrait(name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedTrait === name
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {selectedTrait}
                {traitUnit && <span className="text-gray-400 font-normal ml-1">({traitUnit})</span>}
              </h3>
              <p className="text-xs text-gray-400 mb-4">Averaged across reps per variety</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="variety"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v) => [`${v}${traitUnit ? ' ' + traitUnit : ''}`, selectedTrait]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ranked list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Variety Ranking — {selectedTrait}</h3>
              </div>
              {chartData.map((row, i) => (
                <div key={row.variety} className={`flex items-center px-4 py-3 gap-3 ${i < chartData.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{row.variety}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {row.value}{traitUnit ? ` ${traitUnit}` : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary table */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                All plots — key metrics
              </h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th
                        className="text-left px-3 py-2.5 text-gray-500 font-semibold cursor-pointer hover:text-gray-800"
                        onClick={() => toggleSort('plot')}
                      >
                        Plot {sortBy === 'plot' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        className="text-left px-3 py-2.5 text-gray-500 font-semibold cursor-pointer hover:text-gray-800"
                        onClick={() => toggleSort('variety')}
                      >
                        Variety {sortBy === 'variety' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      {TABLE_COLS.map(col => (
                        <th
                          key={col}
                          className="text-right px-3 py-2.5 text-gray-500 font-semibold cursor-pointer hover:text-gray-800 whitespace-nowrap"
                          onClick={() => toggleSort(col)}
                        >
                          {col.replace('Final Yield per Plot', 'Yield (kg)').replace('Plant Stand Count', 'Stand')}
                          {sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, i) => (
                      <tr
                        key={row.plot.id}
                        onClick={() => navigate(`/plot/${row.plot.id}`)}
                        className={`cursor-pointer hover:bg-gray-50 ${i < sortedRows.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <td className="px-3 py-2.5 font-medium text-gray-800">{row.plot.name}</td>
                        <td className="px-3 py-2.5 text-gray-600 truncate max-w-[100px]">{row.plot.variety || '—'}</td>
                        {TABLE_COLS.map(col => (
                          <td key={col} className="px-3 py-2.5 text-right text-gray-700">{row.values[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
