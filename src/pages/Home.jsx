import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

const SEASONS = ['kharif', 'rabi', 'summer', 'spring', 'fall', 'winter']
const DESIGNS = ['RCBD', 'CRD', 'Alpha-lattice', 'Augmented', 'Other']
const CROPS = ['corn', 'wheat', 'cotton', 'rice', 'sorghum', 'other']

function TrialForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', crop: 'corn', season: 'kharif',
    year: new Date().getFullYear(), design_type: 'RCBD', notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trial Name *</label>
        <input
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Corn Trial Kharif 2025"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
          <select
            value={form.crop}
            onChange={e => set('crop', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
          <select
            value={form.season}
            onChange={e => set('season', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            {SEASONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            value={form.year}
            onChange={e => set('year', parseInt(e.target.value))}
            min={2000} max={2100}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Design</label>
          <select
            value={form.design_type}
            onChange={e => set('design_type', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            {DESIGNS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-2.5 bg-green-600 rounded-xl text-sm font-semibold text-white">
          {initial ? 'Save Changes' : 'Create Trial'}
        </button>
      </div>
    </form>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { trials, init, addTrial, deleteTrial } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { init() }, [])

  const handleAdd = async (form) => {
    const trial = await addTrial(form)
    setShowAdd(false)
    navigate(`/trial/${trial.id}`)
  }

  return (
    <Layout
      title="FieldBook"
      actions={
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      <div className="px-4 py-4 space-y-3">
        {trials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No trials yet</h2>
            <p className="text-gray-500 mb-6 text-sm">Tap + to create your first trial</p>
            <button onClick={() => setShowAdd(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">
              New Trial
            </button>
          </div>
        ) : (
          trials
            .slice()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(trial => (
              <div
                key={trial.id}
                onClick={() => navigate(`/trial/${trial.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 cursor-pointer active:bg-gray-50"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🌽</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{trial.name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {trial.crop} · {trial.season} {trial.year}
                    {trial.design_type && ` · ${trial.design_type}`}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(trial) }}
                  className="p-2 text-gray-300 hover:text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Trial">
        <TrialForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Trial?">
        <p className="text-gray-600 mb-4 text-sm">
          This will permanently delete <strong>{confirmDelete?.name}</strong> and all its plots and observations.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDelete(null)}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">
            Cancel
          </button>
          <button
            onClick={async () => { await deleteTrial(confirmDelete.id); setConfirmDelete(null) }}
            className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm font-semibold text-white">
            Delete
          </button>
        </div>
      </Modal>
    </Layout>
  )
}
