'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NYC_NEIGHBORHOODS = [
  // Manhattan
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
  // Brooklyn
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
  { value: 'bedford-stuyvesant', label: 'Bedford-Stuyvesant', borough: 'Brooklyn' },
  { value: 'bushwick', label: 'Bushwick', borough: 'Brooklyn' },
  { value: 'sunset-park', label: 'Sunset Park', borough: 'Brooklyn' },
  { value: 'bay-ridge', label: 'Bay Ridge', borough: 'Brooklyn' },
  // Queens
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

export default function NewMonitorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [noFee, setNoFee] = useState(false)
  const [petFriendly, setPetFriendly] = useState(false)
  const [laundryInUnit, setLaundryInUnit] = useState(false)
  const [laundryInBuilding, setLaundryInBuilding] = useState(false)

  function toggleNeighborhood(value: string) {
    setSelectedNeighborhoods(prev =>
      prev.includes(value) ? prev.filter(n => n !== value) : [...prev, value]
    )
  }

  function toggleBedroom(value: number) {
    setSelectedBedrooms(prev =>
      prev.includes(value) ? prev.filter(b => b !== value) : [...prev, value]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedNeighborhoods.length === 0) {
      setError('Select at least one neighborhood.')
      return
    }
    if (!maxPrice) {
      setError('Set a maximum rent.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || `${selectedNeighborhoods[0]} monitor`,
        neighborhoods: selectedNeighborhoods,
        bedrooms: selectedBedrooms.length > 0 ? selectedBedrooms : null,
        min_price: minPrice ? parseInt(minPrice) : null,
        max_price: parseInt(maxPrice),
        no_fee: noFee,
        pet_friendly: petFriendly,
        laundry_in_unit: laundryInUnit,
        laundry_in_building: laundryInBuilding,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const boroughs = Array.from(new Set(NYC_NEIGHBORHOODS.map(n => n.borough)))

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#2C2420]">New monitor</h1>
        <p className="text-sm text-[#6B5E52] mt-1">
          Set your criteria and we'll alert you when a match appears.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <label className="block text-sm font-medium text-[#2C2420] mb-3">Monitor name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. 1BR under $2,500 Manhattan"
            className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]"
          />
        </div>

        {/* Neighborhoods */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <label className="block text-sm font-medium text-[#2C2420] mb-4">Neighborhoods</label>
          {boroughs.map(borough => (
            <div key={borough} className="mb-4">
              <div className="text-xs font-medium text-[#6B5E52] mb-2">{borough}</div>
              <div className="flex flex-wrap gap-2">
                {NYC_NEIGHBORHOODS.filter(n => n.borough === borough).map(n => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => toggleNeighborhood(n.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedNeighborhoods.includes(n.value)
                        ? 'bg-[#C4703A] border-[#C4703A] text-white'
                        : 'border-[#E8E0D5] text-[#6B5E52] hover:border-[#C4703A] hover:text-[#C4703A]'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bedrooms + Price */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)] space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#2C2420] mb-3">Bedrooms</label>
            <div className="flex flex-wrap gap-2">
              {BEDROOMS.map(b => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => toggleBedroom(b.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedBedrooms.includes(b.value)
                      ? 'bg-[#C4703A] border-[#C4703A] text-white'
                      : 'border-[#E8E0D5] text-[#6B5E52] hover:border-[#C4703A] hover:text-[#C4703A]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B5E52] mt-2">Leave empty to match any</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B5E52] mb-1.5">Min rent (optional)</label>
              <input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="1000"
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5E52] mb-1.5">Max rent *</label>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="2500"
                required
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <label className="block text-sm font-medium text-[#2C2420] mb-4">Amenities</label>
          <div className="space-y-3">
            {[
              { key: 'noFee', label: 'No broker fee', value: noFee, set: setNoFee },
              { key: 'petFriendly', label: 'Pet friendly', value: petFriendly, set: setPetFriendly },
              { key: 'laundryInUnit', label: 'Laundry in unit', value: laundryInUnit, set: setLaundryInUnit },
              { key: 'laundryInBuilding', label: 'Laundry in building', value: laundryInBuilding, set: setLaundryInBuilding },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => item.set(!item.value)}
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${item.value ? 'bg-[#C4703A]' : 'bg-[#E8E0D5]'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-4.5' : ''}`}
                  />
                </button>
                <span className="text-sm text-[#2C2420]">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C4703A] text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create monitor'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-[#6B5E52] hover:text-[#2C2420] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
