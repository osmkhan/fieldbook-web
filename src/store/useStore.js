import { create } from 'zustand'
import { db, resetAndSeed } from '../db/index'

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
  upsertObservation: async (plot_id, trait_id, value, notes = '') => {
    const existing = await db.observations
      .where('[plot_id+trait_id]').equals([plot_id, trait_id])
      .first()
    const today = new Date().toISOString().split('T')[0]
    let obs
    if (existing) {
      await db.observations.update(existing.id, { value, notes, observed_on: today })
      obs = { ...existing, value, notes, observed_on: today }
    } else {
      const id = await db.observations.add({ plot_id, trait_id, value, notes, observed_on: today })
      obs = await db.observations.get(id)
    }
    set(s => {
      const filtered = s.observations.filter(o => !(o.plot_id === plot_id && o.trait_id === trait_id))
      return { observations: [...filtered, obs] }
    })
    return obs
  },

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
