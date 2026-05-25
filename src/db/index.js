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

db.on('populate', async () => {
  await db.traits.bulkAdd(CORN_TRAITS)
})

export async function resetAndSeed() {
  const count = await db.traits.count()
  if (count === 0) {
    await db.traits.bulkAdd(CORN_TRAITS)
  }
}
