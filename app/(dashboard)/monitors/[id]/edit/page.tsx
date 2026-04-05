'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
  { value: 'laundry_in_unit', label: 'Laundry in unit' },
  { value: 'laundry_in_building', label: 'Laundry in building' },
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

export default function EditMonitorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [scanInterval, setScanInterval] = useState(1440)
  const isPro = false

  useEffect(() => {
    fetch(`/api/monitors/${id}`)
      .then(r => r.json())
      .then(monitor => {
        setName(monitor.name ?? '')
        setSelectedNeighborhoods(monitor.neighborhoods ?? [])
        setSelectedBedrooms(monitor.bedrooms ?? [])
        setMinPrice(monitor.min_price ? String(monitor.min_price) : '')
        setMaxPrice(monitor.max_price ? String(monitor.max_price) : '')
        setScanInterval(monitor.scan_interval ?? 1440)

        // Reconstruct the unified amenities array from legacy booleans + amenities array
        const amenities: string[] = [...(monitor.amenities ?? [])]
        if (monitor.no_fee) amenities.push('no_fee')
        if (monitor.pet_friendly) amenities.push('pets_ok')
        if (monitor.laundry_in_unit) amenities.push('laundry_in_unit')
        if (monitor.laundry_in_building) amenities.push('laundry_in_building')
        setSelectedAmenities([...new Set(amenities)])

        setFetching(false)
      })
      .catch(() => { setError('Failed to load monitor.'); setFetching(false) })
  }, [id])

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

  function toggleAmenity(value: string) {
    setSelectedAmenities(prev =>
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    )
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

    const res = await fetch(`/api/monitors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || `${selectedNeighborhoods[0].replace(/-/g, ' ')} monitor`,
        neighborhoods: selectedNeighborhoods,
        bedrooms: selectedBedrooms.length > 0 ? selectedBedrooms : null,
        min_price: minPrice ? parseInt(minPrice) : null,
        max_price: parseInt(maxPrice),
        no_fee,
        pet_friendly,
        laundry_in_unit,
        laundry_in_building,
        amenities,
        scan_interval: scanInterval,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    } else {
      router.push(`/monitors/${id}`)
    }
  }

  const boroughs = Array.from(new Set(NYC_NEIGHBORHOODS.map(n => n.borough)))
  const intervals = isPro ? PRO_INTERVALS : FREE_INTERVALS

  if (fetching) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <div className="h-8 w-48 bg-[#F0EBE1] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)] h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href={`/monitors/${id}`} className="text-xs text-[#6B5E52] hover:text-[#C4703A] mb-2 block">
          ← Back to monitor
        </Link>
        <h1 className="font-serif text-3xl text-[#2C2420]">Edit monitor</h1>
        <p className="text-sm text-[#6B5E52] mt-1">Update your criteria. Existing matches are preserved.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
                  <button key={n.value} type="button" onClick={() => toggleNeighborhood(n.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedNeighborhoods.includes(n.value) ? 'bg-[#C4703A] border-[#C4703A] text-white' : 'border-[#E8E0D5] text-[#6B5E52] hover:border-[#C4703A] hover:text-[#C4703A]'}`}>
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
                <button key={b.value} type="button" onClick={() => toggleBedroom(b.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedBedrooms.includes(b.value) ? 'bg-[#C4703A] border-[#C4703A] text-white' : 'border-[#E8E0D5] text-[#6B5E52] hover:border-[#C4703A] hover:text-[#C4703A]'}`}>
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B5E52] mt-2">Leave empty to match any</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B5E52] mb-1.5">Min rent (optional)</label>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="1000"
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5E52] mb-1.5">Max rent *</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="2500" required
                className="w-full border border-[#E8E0D5] rounded-xl px-3.5 py-2.5 text-sm text-[#2C2420] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4703A]/30 focus:border-[#C4703A]" />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <label className="block text-sm font-medium text-[#2C2420] mb-4">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button key={a.value} type="button" onClick={() => toggleAmenity(a.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedAmenities.includes(a.value) ? 'bg-[#C4703A] border-[#C4703A] text-white' : 'border-[#E8E0D5] text-[#6B5E52] hover:border-[#C4703A] hover:text-[#C4703A]'}`}>
                {a.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B5E52] mt-3">Leave empty to match any</p>
        </div>

        {/* Scan frequency */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <label className="block text-sm font-medium text-[#2C2420] mb-1">Scan frequency</label>
          {!isPro && <p className="text-xs text-[#6B5E52] mb-3">Upgrade to Pro for scans as fast as every 10 minutes.</p>}
          <div className="flex flex-wrap gap-2">
            {intervals.map(i => (
              <button key={i.value} type="button" onClick={() => setScanInterval(i.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${scanInterval === i.value ? 'bg-[#C4703A] border-[#C4703A] text-white' : 'border-[#E8E0D5] text-[#6B5E52] hover:border-[#C4703A] hover:text-[#C4703A]'}`}>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="bg-[#C4703A] text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <Link href={`/monitors/${id}`} className="text-sm text-[#6B5E52] hover:text-[#2C2420] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
