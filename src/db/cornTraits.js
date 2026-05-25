export const CORN_TRAITS = [
  // Key Dates
  { crop: 'corn', stage: 'key_date', name: 'Planting Date',          format: 'date',        unit: null,  min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'key_date', name: 'Emergence Date',         format: 'date',        unit: null,  min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'key_date', name: 'Tasseling Date',         format: 'date',        unit: null,  min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'key_date', name: 'Silking Date',           format: 'date',        unit: null,  min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'key_date', name: 'Anthesis Date',          format: 'date',        unit: null,  min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'key_date', name: 'Physiological Maturity', format: 'date',        unit: null,  min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'key_date', name: 'Harvest Date',           format: 'date',        unit: null,  min: null, max: null, categories: [] },

  // Vegetative
  { crop: 'corn', stage: 'vegetative', name: 'Germination %',      format: 'numeric',      unit: '%',   min: 0,   max: 100, categories: [] },
  { crop: 'corn', stage: 'vegetative', name: 'Plant Stand Count',   format: 'numeric',      unit: 'plants/plot', min: 0, max: null, categories: [] },
  { crop: 'corn', stage: 'vegetative', name: 'Plant Height',        format: 'numeric',      unit: 'cm',  min: 0,   max: 500, categories: [] },
  { crop: 'corn', stage: 'vegetative', name: 'Ear Height',          format: 'numeric',      unit: 'cm',  min: 0,   max: 300, categories: [] },
  { crop: 'corn', stage: 'vegetative', name: 'Leaf Color',          format: 'categorical',  unit: null,  min: null, max: null, categories: ['dark green','light green','yellow','other'] },
  { crop: 'corn', stage: 'vegetative', name: 'Leaf Shape',          format: 'categorical',  unit: null,  min: null, max: null, categories: ['upright','droopy','wavy'] },
  { crop: 'corn', stage: 'vegetative', name: 'Leaf Width',          format: 'categorical',  unit: null,  min: null, max: null, categories: ['narrow','medium','broad'] },
  { crop: 'corn', stage: 'vegetative', name: 'Disease Symptoms',    format: 'text',         unit: null,  min: null, max: null, categories: [] },

  // Reproductive
  { crop: 'corn', stage: 'reproductive', name: 'Days to Tassel',          format: 'numeric',     unit: 'days', min: 0, max: 200, categories: [], auto_calc: 'days_from_planting_to_tasseling' },
  { crop: 'corn', stage: 'reproductive', name: 'Days to Silk',            format: 'numeric',     unit: 'days', min: 0, max: 200, categories: [], auto_calc: 'days_from_planting_to_silking' },
  { crop: 'corn', stage: 'reproductive', name: 'ASI',                     format: 'numeric',     unit: 'days', min: -30, max: 30, categories: [], auto_calc: 'anthesis_silking_interval' },
  { crop: 'corn', stage: 'reproductive', name: 'Tassel Size',             format: 'categorical', unit: null,   min: null, max: null, categories: ['small','medium','large'] },
  { crop: 'corn', stage: 'reproductive', name: 'Ear Count per Plant',     format: 'numeric',     unit: 'ears', min: 0, max: 10, categories: [] },
  { crop: 'corn', stage: 'reproductive', name: 'Husk Cover',              format: 'categorical', unit: null,   min: null, max: null, categories: ['good','poor','tip exposed'] },

  // Harvest
  { crop: 'corn', stage: 'harvest', name: 'Ear Length',               format: 'numeric', unit: 'cm',    min: 0, max: 50,  categories: [] },
  { crop: 'corn', stage: 'harvest', name: 'Ear Diameter',             format: 'numeric', unit: 'cm',    min: 0, max: 20,  categories: [] },
  { crop: 'corn', stage: 'harvest', name: 'Kernel Rows',              format: 'numeric', unit: 'rows',  min: 0, max: 30,  categories: [] },
  { crop: 'corn', stage: 'harvest', name: '100-Kernel Weight',        format: 'numeric', unit: 'g',     min: 0, max: 100, categories: [] },
  { crop: 'corn', stage: 'harvest', name: 'Grain Moisture at Harvest',format: 'numeric', unit: '%',     min: 0, max: 100, categories: [] },
  { crop: 'corn', stage: 'harvest', name: 'Final Yield per Plot',     format: 'numeric', unit: 'kg',    min: 0, max: null, categories: [] },
  { crop: 'corn', stage: 'harvest', name: 'Yield (t/ha)',             format: 'numeric', unit: 't/ha',  min: 0, max: null, categories: [], auto_calc: 'yield_t_ha' },
  { crop: 'corn', stage: 'harvest', name: 'Stalk Lodging %',          format: 'numeric', unit: '%',     min: 0, max: 100, categories: [] },
  { crop: 'corn', stage: 'harvest', name: 'Root Lodging %',           format: 'numeric', unit: '%',     min: 0, max: 100, categories: [] },

  // Field Notes
  { crop: 'corn', stage: 'field_notes', name: 'General Notes',       format: 'text',        unit: null, min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'field_notes', name: 'Photo',               format: 'photo',       unit: null, min: null, max: null, categories: [] },
  { crop: 'corn', stage: 'field_notes', name: 'Pest/Disease Rating', format: 'categorical', unit: null, min: null, max: null, categories: ['1','2','3','4','5','6','7','8','9'] },
]

export const STAGE_LABELS = {
  key_date:     'Key Dates',
  vegetative:   'Vegetative',
  reproductive: 'Reproductive',
  harvest:      'Harvest',
  field_notes:  'Field Notes',
}
