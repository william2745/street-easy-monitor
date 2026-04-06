'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NYC_NEIGHBORHOODS = [
  { value: 'upper-west-side', label: 'Upper West Side', borough: 'Manhattan' },
  { value: 'upper-east-side', label: 'Upper East Side', borough: 'Manhattan' },
  { value: 'harlem', label: 'Harlem', borough: 'Manhattan' },
  { value: 'washington-heights', label: 'Washington Heights', borough: 'Manhattan' },
  { value: 'inwood', label: 'Inwood', borough: 'Manhattan' },
  { value: 'hell-s-kitchen', label: "Hell's Kitchen", borough: 'Manhattan' },
  { value: 'midtown', label: 'Midtown', borough: 'Manhattan' },
  { value: 'murray-hill', label: 'Murray Hill', borough: 'Manhattan' },
  { value: 'gramercy', label: 'Gramercy', borough: 'Manhattan' },
  { value: 'chelsea', label: 'Chelsea', borough: 'Manhattan' },
  { value: 'west-village', label: 'West Village', borough: 'Manhattan' },
  { value: 'greenwich-village', label: 'Greenwich Village', borough: 'Manhattan' },
  { value: 'soho', label: 'SoHo', borough: 'Manhattan' },
  { value: 'tribeca', label: 'Tribeca', borough: 'Manhattan' },
  { value: 'financial-district', label: 'Financial District', borough: 'Manhattan' },
  { value: 'lower-east-side', label: 'Lower East Side', borough: 'Manhattan' },
  { value: 'east-village', label: 'East Village', borough: 'Manhattan' },
  { value: 'nolita', label: 'Nolita', borough: 'Manhattan' },
  { value: 'kips-bay', label: 'Kips Bay', borough: 'Manhattan' },
  { value: 'morningside-heights', label: 'Morningside Heights', borough: 'Manhattan' },
  { value: 'williamsburg', label: 'Williamsburg', borough: 'Brooklyn' },
  { value: 'greenpoint', label: 'Greenpoint', borough: 'Brooklyn' },
  { value: 'park-slope', label: 'Park Slope', borough: 'Brooklyn' },
  { value: 'brooklyn-heights', label: 'Brooklyn Heights', borough: 'Brooklyn' },
  { value: 'cobble-hill', label: 'Cobble Hill', borough: 'Brooklyn' },
  { value: 'carroll-gardens', label: 'Carroll Gardens', borough: 'Brooklyn' },
  { value: 'boerum-hill', label: 'Boerum Hill', borough: 'Brooklyn' },
  { value: 'fort-greene', label: 'Fort Greene', borough: 'Brooklyn' },
  { value: 'clinton-hill', label: 'Clinton Hill', borough: 'Brooklyn' },
  { value: 'prospect-heights', label: 'Prospect Heights', borough: 'Brooklyn' },
  { value: 'crown-heights', label: 'Crown Heights', borough: 'Brooklyn' },
  { value: 'bedford-stuyvesant', label: 'Bed-Stuy', borough: 'Brooklyn' },
  { value: 'bushwick', label: 'Bushwick', borough: 'Brooklyn' },
  { value: 'sunset-park', label: 'Sunset Park', borough: 'Brooklyn' },
  { value: 'bay-ridge', label: 'Bay Ridge', borough: 'Brooklyn' },
  { value: 'astoria', label: 'Astoria', borough: 'Queens' },
  { value: 'long-island-city', label: 'Long Island City', borough: 'Queens' },
  { value: 'sunnyside', label: 'Sunnyside', borough: 'Queens' },
  { value: 'jackson-heights', label: 'Jackson Heights', borough: 'Queens' },
  { value: 'forest-hills', label: 'Forest Hills', borough: 'Queens' },
]

const BEDROOMS = [
  { value: 0, label: 'Studio' },
  { value: 1, label: '1 BR' },
  { value: 2, label: '2 BR' },
  { value: 3, label: '3 BR' },
  { value: 4, label: '4+ BR' },
]

const AMENITIES = [
  { value: 'no_fee', label: 'No broker fee' },
  { value: 'pets_ok', label: 'Pet friendly' },
  { value: 'laundry_in_unit', label: 'In-unit laundry' },
  { value: 'laundry_in_building', label: 'Building laundry' },
  { value: 'doorman', label: 'Doorman' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'gym', label: 'Gym' },
  { value: 'outdoor_space', label: 'Outdoor space' },
  { value: 'private_outdoor', label: 'Private outdoor' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'furnished', label: 'Furnished' },
  { value: 'parking', label: 'Parking' },
]

const FREE_INTERVALS = [
  { value: 1440, label: 'Daily' },
  { value: 720, label: 'Twice daily' },
  { value: 360, label: 'Every 6 hours' },
]

const PRO_INTERVALS = [
  { value: 10, label: 'Every 10 min' },
  { value: 15, label: 'Every 15 min' },
  { value: 30, label: 'Every 30 min' },
  { value: 60, label: 'Every hour' },
  { value: 180, label: 'Every 3 hours' },
  { value: 360, label: 'Every 6 hours' },
]

const chipClass = (active: boolean) =>
  `text-xs px-3 py-1.5 rounded-md border transition-colors font-medium ${
    active
      ? 'bg-emerald-600 border-emerald-600 text-white'
      : 'border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:text-emerald-700'
  }`

export default function NewMonitorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [scanInterval, setScanInterval] = useState(1440)
  const isPro = false

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedNeighborhoods.length === 0) { setError('Select at least one neighborhood.'); return }
    if (!maxPrice) { setError('Set a maximum rent.'); return }

    setLoading(true)
    setError('')

    const no_fee = selectedAmenities.includes('no_fee')
    const pet_friendly = selectedAmenities.includes('pets_ok')
    const laundry_in_unit = selectedAmenities.includes('laundry_in_unit')
    const laundry_in_building = selectedAmenities.includes('laundry_in_building')
    const amenities = selectedAmenities.filter(a => !['no_fee', 'pets_ok', 'laundry_in_unit', 'laundry_in_building'].includes(a))

    const res = await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || `${selectedNeighborhoods[0].replace(/-/g, ' ')} monitor`,
        neighborhoods: selectedNeighborhoods,
        bedrooms: selectedBedrooms.length > 0 ? selectedBedrooms : null,
        min_price: minPrice ? parseInt(minPrice) : null,
        max_price: parseInt(maxPrice),
        no_fee, pet_friendly, laundry_in_unit, laundry_in_building, amenities,
        scan_interval: scanInterval,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    } else {
      router.push('/monitors')
    }
  }

  const boroughs = Array.from(new Set(NYC_NEIGHBORHOODS.map(n => n.borough)))
  const intervals = isPro ? PRO_INTERVALS : FREE_INTERVALS

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">New monitor</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Define your search criteria. We&apos;ll alert you when matches appear.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5">
          <label className="block text-sm font-medium text-zinc-900 mb-2">Monitor name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. 1BR under $2,500 in Manhattan"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </section>

        {/* Neighborhoods */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5">
          <label className="block text-sm font-medium text-zinc-900 mb-3">Neighborhoods</label>
          {boroughs.map(borough => (
            <div key={borough} className="mb-4 last:mb-0">
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">{borough}</div>
              <div className="flex flex-wrap gap-1.5">
                {NYC_NEIGHBORHOODS.filter(n => n.borough === borough).map(n => (
                  <button key={n.value} type="button" onClick={() => setSelectedNeighborhoods(prev => toggle(prev, n.value))}
                    className={chipClass(selectedNeighborhoods.includes(n.value))}>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Bedrooms + Price */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">Bedrooms</label>
            <div className="flex flex-wrap gap-1.5">
              {BEDROOMS.map(b => (
                <button key={b.value} type="button" onClick={() => setSelectedBedrooms(prev => toggle(prev, b.value))}
                  className={chipClass(selectedBedrooms.includes(b.value))}>
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-2">Leave empty for any</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Min rent</label>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="1000"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Max rent *</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="2500" required
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5">
          <label className="block text-sm font-medium text-zinc-900 mb-3">Amenities</label>
          <div className="flex flex-wrap gap-1.5">
            {AMENITIES.map(a => (
              <button key={a.value} type="button" onClick={() => setSelectedAmenities(prev => toggle(prev, a.value))}
                className={chipClass(selectedAmenities.includes(a.value))}>
                {a.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-2">Leave empty for any</p>
        </section>

        {/* Scan frequency */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5">
          <label className="block text-sm font-medium text-zinc-900 mb-1">Scan frequency</label>
          {!isPro && <p className="text-xs text-zinc-400 mb-3">Upgrade to Pro for scans as fast as every 10 minutes.</p>}
          <div className="flex flex-wrap gap-1.5">
            {intervals.map(i => (
              <button key={i.value} type="button" onClick={() => setScanInterval(i.value)}
                className={chipClass(scanInterval === i.value)}>
                {i.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create monitor'}
          </button>
          <button type="button" onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
