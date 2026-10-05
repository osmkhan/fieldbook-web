import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { db } from '../db/index'
import Layout from '../components/Layout'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

async function buildRows(trialId) {
  const trial = await db.trials.get(trialId)
  const plots = await db.plots.where('trial_id').equals(trialId).toArray()
  const plotIds = plots.map(p => p.id)
  const observations = await db.observations.where('plot_id').anyOf(plotIds).toArray()
  const traitIds = [...new Set(observations.map(o => o.trait_id))]
  const traitsList = await db.traits.where('id').anyOf(traitIds).toArray()
  const traitMap = Object.fromEntries(traitsList.map(t => [t.id, t]))
  const plotMap = Object.fromEntries(plots.map(p => [p.id, p]))

  return observations.map(obs => {
    const plot = plotMap[obs.plot_id]
    const trait = traitMap[obs.trait_id]
    return {
      // Date is part of the key — the same trait can be measured on several dates.
      unique_id: `${trial.name}_${plot?.name}_${trait?.name}_${obs.observed_on}`,
      trial: trial.name,
      variety: plot?.variety ?? '',
      rep: plot?.rep ?? '',
      plot: plot?.name ?? '',
      trait: trait?.name ?? '',
      format: trait?.format ?? '',
      unit: trait?.unit ?? '',
      value: obs.value,
      // Individual plant readings are preserved so the mean can be recomputed
      // or re-analysed later; blank for plot-level traits.
      n_plants: obs.readings?.length ?? '',
      readings: obs.readings?.join(' ') ?? '',
      status: obs.status ?? 'recorded',
      observed_on: obs.observed_on,
      lat: plot?.lat ?? '',
      lng: plot?.lng ?? '',
      notes: obs.notes ?? '',
    }
  })
}

async function buildSummaryMatrix(trialId) {
  const plots = await db.plots.where('trial_id').equals(trialId).toArray()
  const plotIds = plots.map(p => p.id)
  const observations = await db.observations.where('plot_id').anyOf(plotIds).toArray()
  const traitIds = [...new Set(observations.map(o => o.trait_id))]
  const traitsList = await db.traits.where('id').anyOf(traitIds).toArray()
  const traitMap = Object.fromEntries(traitsList.map(t => [t.id, t]))

  // Oldest first so the latest reading wins in the summary matrix.
  const obsIndex = {}
  ;[...observations]
    .sort((a, b) => (a.observed_on ?? '').localeCompare(b.observed_on ?? ''))
    .forEach(o => { obsIndex[`${o.plot_id}_${o.trait_id}`] = o.value })

  const header = ['Plot', 'Variety', 'Rep', ...traitsList.map(t => t.name)]
  const rows = plots.map(plot => [
    plot.name,
    plot.variety,
    plot.rep,
    ...traitsList.map(t => obsIndex[`${plot.id}_${t.id}`] ?? ''),
  ])
  return [header, ...rows]
}

export default function Export() {
  const { trialId } = useParams()
  const navigate = useNavigate()
  const { trials } = useStore()
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(null)

  const trial = trials.find(t => t.id === parseInt(trialId))
  const slug = trial?.name.replace(/\s+/g, '_') ?? 'trial'

  const exportCSV = async () => {
    setExporting(true)
    try {
      const rows = await buildRows(parseInt(trialId))
      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}_export.csv`
      a.click()
      URL.revokeObjectURL(url)
      setDone('csv')
    } finally {
      setExporting(false)
    }
  }

  const exportXLSX = async () => {
    setExporting(true)
    try {
      const rows = await buildRows(parseInt(trialId))
      const summaryMatrix = await buildSummaryMatrix(parseInt(trialId))

      const wb = XLSX.utils.book_new()

      // Summary sheet (variety × trait matrix)
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryMatrix)
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary')

      // Raw observations sheet
      if (rows.length > 0) {
        const rawWS = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, rawWS, 'Raw Observations')
      }

      // Per-trait sheets
      const traitGroups = {}
      rows.forEach(r => {
        if (!traitGroups[r.trait]) traitGroups[r.trait] = []
        traitGroups[r.trait].push(r)
      })
      Object.entries(traitGroups).forEach(([traitName, traitRows]) => {
        const name = traitName.slice(0, 31) // Excel sheet name limit
        const ws = XLSX.utils.json_to_sheet(traitRows)
        XLSX.utils.book_append_sheet(wb, ws, name)
      })

      XLSX.writeFile(wb, `${slug}_export.xlsx`)
      setDone('xlsx')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Layout back={() => navigate(-1)} title="Export Data">
      <div className="px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">{trial?.name}</h2>
          <p className="text-sm text-gray-500 mb-4">
            Export all observations for this trial. CSV is compatible with Field Book's standard format.
          </p>

          <div className="space-y-3">
            <button
              onClick={exportCSV}
              disabled={exporting}
              className="w-full flex items-center gap-4 p-4 border-2 border-green-200 hover:border-green-500 rounded-2xl text-left transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Export as CSV</div>
                <div className="text-sm text-gray-500">Field Book compatible · R-script ready</div>
              </div>
              {done === 'csv' && <span className="ml-auto text-green-600 text-sm font-medium">✓ Done</span>}
            </button>

            <button
              onClick={exportXLSX}
              disabled={exporting}
              className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 hover:border-blue-500 rounded-2xl text-left transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Export as Excel</div>
                <div className="text-sm text-gray-500">Summary sheet + one sheet per trait</div>
              </div>
              {done === 'xlsx' && <span className="ml-auto text-blue-600 text-sm font-medium">✓ Done</span>}
            </button>
          </div>
        </div>

        {/* Column info */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CSV Columns</h3>
          <div className="text-xs text-gray-600 font-mono space-y-0.5">
            <div>unique_id · trial · variety · rep · plot</div>
            <div>trait · value · observed_on · lat · lng</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
