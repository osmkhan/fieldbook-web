import Dexie from 'dexie'
import { CORN_TRAITS } from './cornTraits'

export const db = new Dexie('FieldBookDB')

db.version(1).stores({
  trials:        '++id, name, crop, season, year, created_at',
  plots:         '++id, trial_id, name, variety, rep',
  traits:        '++id, crop, name, stage',
  trial_traits:  '[trial_id+trait_id], trial_id, trait_id',
  observations:  '++id, plot_id, trait_id, observed_on, [plot_id+trait_id]',
  weather_notes: '++id, trial_id, date',
})

// v2 — observations become one-per-(plot, trait, DAY) instead of one-per-(plot, trait).
// Measuring the same trait again later no longer destroys the earlier reading.
// Adds `readings` (individual plant measurements) and `status` ('recorded' | 'na').
db.version(2).stores({
  trials:        '++id, name, crop, season, year, created_at',
  plots:         '++id, trial_id, name, variety, rep, sort_order',
  traits:        '++id, crop, name, stage',
  trial_traits:  '[trial_id+trait_id], trial_id, trait_id',
  observations:  '++id, plot_id, trait_id, observed_on, [plot_id+trait_id], [plot_id+trait_id+observed_on]',
  weather_notes: '++id, trial_id, date',
}).upgrade(async tx => {
  await tx.table('observations').toCollection().modify(o => {
    if (o.readings === undefined) o.readings = null
    if (o.status === undefined) o.status = o.value === 'NA' ? 'na' : 'recorded'
    if (!o.observed_on) o.observed_on = new Date().toISOString().split('T')[0]
  })
  await tx.table('plots').toCollection().modify((p, ref) => {
    if (p.sort_order === undefined) p.sort_order = ref.value.id ?? 0
  })
})

db.on('populate', async () => {
  await db.traits.bulkAdd(CORN_TRAITS)
})

export async function resetAndSeed() {
  const count = await db.traits.count()
  if (count === 0) {
    await db.traits.bulkAdd(CORN_TRAITS)
  } else {
    // Backfill newly-added trait fields onto a library created by an older build.
    // dap/per_plant aren't user-editable, so keeping them in step with the
    // bundled definitions is safe and means stage windows improve on update.
    const byName = Object.fromEntries(CORN_TRAITS.map(t => [t.name, t]))
    await db.traits.toCollection().modify(t => {
      const def = byName[t.name]
      if (!def) return
      if (t.per_plant === undefined) t.per_plant = def.per_plant ?? false
      t.dap = def.dap ?? null
    })
  }
}

export const today = () => new Date().toISOString().split('T')[0]

/** Mean of a readings array, rounded to 1dp. */
export function meanOf(readings) {
  const nums = (readings ?? []).map(Number).filter(n => !isNaN(n))
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

/**
 * Collapse an observation list to the most recent entry per (plot, trait).
 * Used by every read-only view — plot detail, analysis, map, export summary.
 */
export function latestByPlotTrait(observations) {
  const out = {}
  for (const o of observations) {
    const key = `${o.plot_id}:${o.trait_id}`
    if (!out[key] || (o.observed_on ?? '') >= (out[key].observed_on ?? '')) out[key] = o
  }
  return out
}
