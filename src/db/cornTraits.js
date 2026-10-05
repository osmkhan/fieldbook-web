// per_plant: measured on individual plants and averaged (app keeps every reading).
// dap: [min, max] days after planting when this is normally recorded — drives the
// "due now" suggestion on the session screen. Approximate; kharif corn, Punjab.
export const CORN_TRAITS = [
  // Key Dates
  { crop: 'corn', stage: 'key_date', name: 'Planting Date',          format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [0, 0] },
  { crop: 'corn', stage: 'key_date', name: 'Emergence Date',         format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [4, 14] },
  { crop: 'corn', stage: 'key_date', name: 'Tasseling Date',         format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [45, 65] },
  { crop: 'corn', stage: 'key_date', name: 'Silking Date',           format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [50, 70] },
  { crop: 'corn', stage: 'key_date', name: 'Anthesis Date',          format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [48, 68] },
  { crop: 'corn', stage: 'key_date', name: 'Physiological Maturity', format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [90, 120] },
  { crop: 'corn', stage: 'key_date', name: 'Harvest Date',           format: 'date', unit: null, min: null, max: null, categories: [], per_plant: false, dap: [100, 130] },

  // Vegetative
  { crop: 'corn', stage: 'vegetative', name: 'Germination %',      format: 'numeric',     unit: '%',           min: 0, max: 100,  categories: [], per_plant: false, dap: [7, 20] },
  { crop: 'corn', stage: 'vegetative', name: 'Plant Stand Count',  format: 'numeric',     unit: 'plants/plot', min: 0, max: null, categories: [], per_plant: false, dap: [14, 40] },
  { crop: 'corn', stage: 'vegetative', name: 'Plant Height',       format: 'numeric',     unit: 'cm',          min: 0, max: 500,  categories: [], per_plant: true,  dap: [25, 75] },
  { crop: 'corn', stage: 'vegetative', name: 'Ear Height',         format: 'numeric',     unit: 'cm',          min: 0, max: 300,  categories: [], per_plant: true,  dap: [55, 85] },
  { crop: 'corn', stage: 'vegetative', name: 'Leaf Color',         format: 'categorical', unit: null, min: null, max: null, categories: ['dark green','light green','yellow','other'], per_plant: false, dap: [25, 50] },
  { crop: 'corn', stage: 'vegetative', name: 'Leaf Shape',         format: 'categorical', unit: null, min: null, max: null, categories: ['upright','droopy','wavy'],                  per_plant: false, dap: [25, 50] },
  { crop: 'corn', stage: 'vegetative', name: 'Leaf Width',         format: 'categorical', unit: null, min: null, max: null, categories: ['narrow','medium','broad'],                  per_plant: false, dap: [25, 50] },
  { crop: 'corn', stage: 'vegetative', name: 'Disease Symptoms',   format: 'text',        unit: null, min: null, max: null, categories: [], per_plant: false, dap: [30, 100] },

  // Reproductive
  { crop: 'corn', stage: 'reproductive', name: 'Days to Tassel',      format: 'numeric',     unit: 'days', min: 0,   max: 200, categories: [], per_plant: false, dap: null, auto_calc: 'days_from_planting_to_tasseling' },
  { crop: 'corn', stage: 'reproductive', name: 'Days to Silk',        format: 'numeric',     unit: 'days', min: 0,   max: 200, categories: [], per_plant: false, dap: null, auto_calc: 'days_from_planting_to_silking' },
  { crop: 'corn', stage: 'reproductive', name: 'ASI',                 format: 'numeric',     unit: 'days', min: -30, max: 30,  categories: [], per_plant: false, dap: null, auto_calc: 'anthesis_silking_interval' },
  { crop: 'corn', stage: 'reproductive', name: 'Tassel Size',         format: 'categorical', unit: null,   min: null, max: null, categories: ['small','medium','large'],       per_plant: false, dap: [50, 70] },
  { crop: 'corn', stage: 'reproductive', name: 'Ear Count per Plant', format: 'numeric',     unit: 'ears', min: 0, max: 10, categories: [], per_plant: true,  dap: [70, 110] },
  { crop: 'corn', stage: 'reproductive', name: 'Husk Cover',          format: 'categorical', unit: null,   min: null, max: null, categories: ['good','poor','tip exposed'], per_plant: false, dap: [75, 110] },

  // Harvest
  { crop: 'corn', stage: 'harvest', name: 'Ear Length',                format: 'numeric', unit: 'cm',   min: 0, max: 50,   categories: [], per_plant: true,  dap: [100, 130] },
  { crop: 'corn', stage: 'harvest', name: 'Ear Diameter',              format: 'numeric', unit: 'cm',   min: 0, max: 20,   categories: [], per_plant: true,  dap: [100, 130] },
  { crop: 'corn', stage: 'harvest', name: 'Kernel Rows',               format: 'numeric', unit: 'rows', min: 0, max: 30,   categories: [], per_plant: true,  dap: [100, 130] },
  { crop: 'corn', stage: 'harvest', name: '100-Kernel Weight',         format: 'numeric', unit: 'g',    min: 0, max: 100,  categories: [], per_plant: false, dap: [105, 135] },
  { crop: 'corn', stage: 'harvest', name: 'Grain Moisture at Harvest', format: 'numeric', unit: '%',    min: 0, max: 100,  categories: [], per_plant: false, dap: [100, 130] },
  { crop: 'corn', stage: 'harvest', name: 'Final Yield per Plot',      format: 'numeric', unit: 'kg',   min: 0, max: null, categories: [], per_plant: false, dap: [100, 130] },
  { crop: 'corn', stage: 'harvest', name: 'Yield (t/ha)',              format: 'numeric', unit: 't/ha', min: 0, max: null, categories: [], per_plant: false, dap: null, auto_calc: 'yield_t_ha' },
  { crop: 'corn', stage: 'harvest', name: 'Stalk Lodging %',           format: 'numeric', unit: '%',    min: 0, max: 100,  categories: [], per_plant: false, dap: [90, 130] },
  { crop: 'corn', stage: 'harvest', name: 'Root Lodging %',            format: 'numeric', unit: '%',    min: 0, max: 100,  categories: [], per_plant: false, dap: [90, 130] },

  // Field Notes
  { crop: 'corn', stage: 'field_notes', name: 'General Notes',       format: 'text',        unit: null, min: null, max: null, categories: [], per_plant: false, dap: null },
  { crop: 'corn', stage: 'field_notes', name: 'Photo',               format: 'photo',       unit: null, min: null, max: null, categories: [], per_plant: false, dap: null },
  { crop: 'corn', stage: 'field_notes', name: 'Pest/Disease Rating', format: 'categorical', unit: null, min: null, max: null, categories: ['1','2','3','4','5','6','7','8','9'], per_plant: false, dap: [30, 110] },
]

export const STAGE_LABELS = {
  key_date:     'Key Dates',
  vegetative:   'Vegetative',
  reproductive: 'Reproductive',
  harvest:      'Harvest',
  field_notes:  'Field Notes',
}

/** Rough corn growth stage from days after planting — for the "due now" hint. */
export function stageFromDap(dap) {
  if (dap == null) return null
  if (dap < 5)   return 'Just planted'
  if (dap < 15)  return 'Emergence (VE)'
  if (dap < 30)  return 'Early vegetative (V3–V6)'
  if (dap < 45)  return 'Vegetative (V7–V12)'
  if (dap < 55)  return 'Late vegetative (V13–VT)'
  if (dap < 70)  return 'Flowering (VT–R1)'
  if (dap < 90)  return 'Grain fill (R2–R4)'
  if (dap < 110) return 'Dent (R5)'
  return 'Maturity / harvest (R6)'
}
