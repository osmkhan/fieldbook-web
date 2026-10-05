import { create } from 'zustand'
import { db, resetAndSeed, today } from '../db/index'

export const useStore = create((set, get) => ({
  trials: [],
  plots: [],
  traits: [],
  observations: [],
  trialTraits: [],
  loading: false,

  init: async () => {
    await resetAndSeed()
    const [trials, traits] = await Promise.all([
      db.trials.toArray(),
      db.traits.toArray(),
    ])
    set({ trials, traits })
  },

  // Trials
  addTrial: async (data) => {
    const id = await db.trials.add({ ...data, created_at: new Date().toISOString() })
    const trial = await db.trials.get(id)
    set(s => ({ trials: [...s.trials, trial] }))
    return trial
  },
  updateTrial: async (id, data) => {
    await db.trials.update(id, data)
    set(s => ({ trials: s.trials.map(t => t.id === id ? { ...t, ...data } : t) }))
  },
  deleteTrial: async (id) => {
    const plotIds = (await db.plots.where('trial_id').equals(id).toArray()).map(p => p.id)
    await db.observations.where('plot_id').anyOf(plotIds).delete()
    await db.plots.where('trial_id').equals(id).delete()
    await db.trial_traits.where('trial_id').equals(id).delete()
    await db.weather_notes.where('trial_id').equals(id).delete()
    await db.trials.delete(id)
    set(s => ({ trials: s.trials.filter(t => t.id !== id) }))
  },

  // Plots
  loadPlots: async (trial_id) => {
    const plots = await db.plots.where('trial_id').equals(trial_id).toArray()
    set({ plots })
    return plots
  },
  addPlot: async (data) => {
    const id = await db.plots.add(data)
    const plot = await db.plots.get(id)
    set(s => ({ plots: [...s.plots, plot] }))
    return plot
  },
  updatePlot: async (id, data) => {
    await db.plots.update(id, data)
    set(s => ({ plots: s.plots.map(p => p.id === id ? { ...p, ...data } : p) }))
  },
  deletePlot: async (id) => {
    await db.observations.where('plot_id').equals(id).delete()
    await db.plots.delete(id)
    set(s => ({ plots: s.plots.filter(p => p.id !== id) }))
  },

  // Trial Traits
  loadTrialTraits: async (trial_id) => {
    const rows = await db.trial_traits.where('trial_id').equals(trial_id).toArray()
    set({ trialTraits: rows.map(r => r.trait_id) })
    return rows.map(r => r.trait_id)
  },
  toggleTrialTrait: async (trial_id, trait_id) => {
    const existing = await db.trial_traits.get([trial_id, trait_id])
    if (existing) {
      await db.trial_traits.delete([trial_id, trait_id])
      set(s => ({ trialTraits: s.trialTraits.filter(id => id !== trait_id) }))
    } else {
      await db.trial_traits.add({ trial_id, trait_id })
      set(s => ({ trialTraits: [...s.trialTraits, trait_id] }))
    }
  },
  setTrialTraits: async (trial_id, trait_ids) => {
    await db.trial_traits.where('trial_id').equals(trial_id).delete()
    await db.trial_traits.bulkAdd(trait_ids.map(tid => ({ trial_id, trait_id: tid })))
    set({ trialTraits: trait_ids })
  },

  // Observations
  loadObservations: async (plot_id) => {
    const observations = await db.observations.where('plot_id').equals(plot_id).toArray()
    set({ observations })
    return observations
  },
  loadAllObservations: async (trial_id) => {
    const plots = await db.plots.where('trial_id').equals(trial_id).toArray()
    const plotIds = plots.map(p => p.id)
    const observations = await db.observations.where('plot_id').anyOf(plotIds).toArray()
    set({ observations })
    return observations
  },
  /**
   * Save one observation. Keyed by (plot, trait, DATE) — recording the same trait
   * on a later date creates a new row rather than destroying the earlier reading,
   * so repeated measurements through the season build a history.
   *
   * value    — the number/text stored (for per-plant traits this is the mean)
   * readings — individual plant measurements, kept verbatim; null for plot-level traits
   * status   — 'recorded' | 'na'  ('na' = checked, genuinely not available)
   */
  saveObservation: async ({ plot_id, trait_id, value, readings = null, status = 'recorded', notes = '', date }) => {
    const on = date ?? today()
    const existing = await db.observations
      .where('[plot_id+trait_id+observed_on]').equals([plot_id, trait_id, on])
      .first()

    const isEmpty = status === 'recorded' && (value === '' || value == null) &&
                    (!readings || readings.length === 0)

    // Clearing a value deletes the row rather than storing a blank observation.
    if (isEmpty) {
      if (existing) await db.observations.delete(existing.id)
      set(s => ({ observations: s.observations.filter(o => o.id !== existing?.id) }))
      return null
    }

    const row = { plot_id, trait_id, value: String(value ?? ''), readings, status, notes, observed_on: on }
    let obs
    if (existing) {
      await db.observations.update(existing.id, row)
      obs = { ...existing, ...row }
    } else {
      const id = await db.observations.add(row)
      obs = await db.observations.get(id)
    }
    set(s => ({ observations: [...s.observations.filter(o => o.id !== obs.id), obs] }))
    return obs
  },

  // Back-compat wrapper for the plot-detail edit path.
  upsertObservation: async (plot_id, trait_id, value, notes = '') =>
    get().saveObservation({ plot_id, trait_id, value, notes }),

  // Weather notes
  loadWeatherNotes: async (trial_id) => {
    return db.weather_notes.where('trial_id').equals(trial_id).toArray()
  },
  upsertWeatherNote: async (trial_id, date, notes) => {
    const existing = await db.weather_notes.where({ trial_id, date }).first()
    if (existing) {
      await db.weather_notes.update(existing.id, { notes })
    } else {
      await db.weather_notes.add({ trial_id, date, notes })
    }
  },
}))
