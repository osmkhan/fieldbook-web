export default function TraitInput({ trait, value, onChange }) {
  const { format, unit, min, max, categories } = trait

  if (format === 'numeric') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          min={min ?? undefined}
          max={max ?? undefined}
          placeholder="—"
          className="flex-1 text-3xl font-bold text-center border-0 border-b-2 border-green-500 bg-transparent
                     outline-none py-2 text-gray-900 placeholder-gray-300"
        />
        {unit && <span className="text-gray-500 text-lg shrink-0">{unit}</span>}
      </div>
    )
  }

  if (format === 'date') {
    return (
      <input
        type="date"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full text-2xl font-bold text-center border-0 border-b-2 border-green-500 bg-transparent
                   outline-none py-2 text-gray-900"
      />
    )
  }

  if (format === 'text') {
    return (
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder="Type notes here…"
        className="w-full border-2 border-gray-200 rounded-xl p-3 text-gray-900 outline-none
                   focus:border-green-500 resize-none text-base"
      />
    )
  }

  if (format === 'categorical') {
    return (
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(value === cat ? '' : cat)}
            className={`px-5 py-3 rounded-xl text-base font-semibold border-2 transition-all ${
              value === cat
                ? 'bg-green-600 border-green-600 text-white shadow-md'
                : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    )
  }

  if (format === 'boolean') {
    return (
      <div className="flex gap-4 justify-center pt-2">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            className={`flex-1 py-4 rounded-xl text-xl font-bold border-2 transition-all ${
              value === opt
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (format === 'counter') {
    const num = parseInt(value || '0', 10)
    return (
      <div className="flex items-center justify-center gap-6 pt-2">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(0, num - 1)))}
          className="w-16 h-16 rounded-full bg-red-100 text-red-600 text-3xl font-bold"
        >−</button>
        <span className="text-5xl font-bold text-gray-900 min-w-[4rem] text-center">{num}</span>
        <button
          type="button"
          onClick={() => onChange(String(num + 1))}
          className="w-16 h-16 rounded-full bg-green-100 text-green-700 text-3xl font-bold"
        >+</button>
      </div>
    )
  }

  if (format === 'photo') {
    return (
      <div className="text-center py-4">
        <label className="inline-flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
            {value ? (
              <img src={value} alt="captured" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-500">Tap to capture</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => onChange(ev.target.result)
              reader.readAsDataURL(file)
            }}
          />
        </label>
      </div>
    )
  }

  return null
}
