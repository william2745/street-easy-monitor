'use client'

import { useState, useMemo } from 'react'
import { ListingMatch } from '@/types/database'

type SortField = 'found_at' | 'listed_at' | 'price'
type SortDir = 'asc' | 'desc'

function toEastern(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' ET'
}

function toEasternDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Generate a warm-toned gradient based on the listing ID for visual variety */
function placeholderGradient(listingId: string): string {
  const hash = listingId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const gradients = [
    'from-[#F5E8DC] to-[#E8D5C4]',
    'from-[#E8D5C4] to-[#D4C0AA]',
    'from-[#F0EBE1] to-[#E0D6C8]',
    'from-[#F5EDE3] to-[#E5D8CA]',
    'from-[#EDE4D8] to-[#D8CBBB]',
    'from-[#F2E6D9] to-[#DFD0BF]',
  ]
  return gradients[hash % gradients.length]
}

export default function MatchList({
  matches,
  newRunStart,
}: {
  matches: ListingMatch[]
  newRunStart: string | null
  prevRunStart: string | null
}) {
  const [sortField, setSortField] = useState<SortField>('found_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [bedroomFilter, setBedroomFilter] = useState<number | 'all'>('all')
  const [feeFilter, setFeeFilter] = useState<'all' | 'no_fee'>('all')

  const bedroomOptions = useMemo(() => {
    const set = new Set<number>()
    matches.forEach(m => { if (m.bedrooms != null) set.add(m.bedrooms) })
    return Array.from(set).sort()
  }, [matches])

  const hasListedAt = matches.some(m => m.listed_at != null)

  const filtered = useMemo(() => {
    let result = [...matches]

    if (bedroomFilter !== 'all') {
      result = result.filter(m => m.bedrooms === bedroomFilter)
    }
    if (feeFilter === 'no_fee') {
      result = result.filter(m => m.no_fee === true)
    }

    result.sort((a, b) => {
      if (sortField === 'price') {
        const pa = a.price ?? 0
        const pb = b.price ?? 0
        return sortDir === 'asc' ? pa - pb : pb - pa
      }
      if (sortField === 'listed_at') {
        const da = a.listed_at ? new Date(a.listed_at).getTime() : 0
        const db = b.listed_at ? new Date(b.listed_at).getTime() : 0
        return sortDir === 'asc' ? da - db : db - da
      }
      const da = new Date(a.found_at).getTime()
      const db = new Date(b.found_at).getTime()
      return sortDir === 'asc' ? da - db : db - da
    })

    return result
  }, [matches, sortField, sortDir, bedroomFilter, feeFilter])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'price' ? 'asc' : 'desc')
    }
  }

  const arrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const sortBtnClass = (field: SortField) =>
    `text-xs px-3 py-1.5 rounded-full border transition-colors ${
      sortField === field
        ? 'bg-[#2C2420] text-white border-[#2C2420]'
        : 'bg-white text-[#6B5E52] border-[#E8E0D5] hover:bg-[#F0EBE1]'
    }`

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={() => toggleSort('found_at')} className={sortBtnClass('found_at')}>
          Date found{arrow('found_at')}
        </button>
        {hasListedAt && (
          <button onClick={() => toggleSort('listed_at')} className={sortBtnClass('listed_at')}>
            Available{arrow('listed_at')}
          </button>
        )}
        <button onClick={() => toggleSort('price')} className={sortBtnClass('price')}>
          Price{arrow('price')}
        </button>

        <span className="w-px h-5 bg-[#E8E0D5] mx-1" />

        <select
          value={bedroomFilter === 'all' ? 'all' : String(bedroomFilter)}
          onChange={e => setBedroomFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="text-xs px-3 py-1.5 rounded-full border border-[#E8E0D5] bg-white text-[#6B5E52] focus:outline-none focus:border-[#C4703A]"
        >
          <option value="all">All bedrooms</option>
          {bedroomOptions.map(b => (
            <option key={b} value={b}>{b === 0 ? 'Studio' : `${b} BR`}</option>
          ))}
        </select>

        <select
          value={feeFilter}
          onChange={e => setFeeFilter(e.target.value as 'all' | 'no_fee')}
          className="text-xs px-3 py-1.5 rounded-full border border-[#E8E0D5] bg-white text-[#6B5E52] focus:outline-none focus:border-[#C4703A]"
        >
          <option value="all">Any fee</option>
          <option value="no_fee">No fee only</option>
        </select>

        <span className="text-xs text-[#6B5E52] ml-auto">
          {filtered.length} of {matches.length} listing{matches.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Listing cards */}
      <div className="space-y-3">
        {filtered.map(match => {
          const isNew = newRunStart
            ? new Date(match.found_at) >= new Date(newRunStart)
            : false
          const gradient = placeholderGradient(match.listing_id)

          return (
            <a
              key={match.id}
              href={match.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex bg-white rounded-xl shadow-[0_1px_4px_rgba(44,36,32,0.08)] hover:shadow-[0_4px_16px_rgba(44,36,32,0.12)] transition-shadow group overflow-hidden"
            >
              <div className={`relative w-32 sm:w-40 shrink-0 min-h-[110px] bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5`}>
                {match.price != null && (
                  <span className="text-lg font-bold text-[#2C2420]/70">
                    ${match.price.toLocaleString()}
                  </span>
                )}
                <span className="text-xs font-medium text-[#6B5E52]/70 bg-white/50 px-2 py-0.5 rounded-full">
                  {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms} BR`) : '—'}
                </span>
                {isNew && (
                  <span className="absolute top-2 left-2 text-xs bg-[#C4703A] text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                    NEW
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-medium text-[#2C2420] group-hover:text-[#C4703A] transition-colors truncate">
                    {match.address ?? match.neighborhood ?? 'NYC listing'}
                  </div>
                  <div className="text-xs text-[#6B5E52] mt-0.5">
                    {match.neighborhood}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {match.price != null && (
                      <span className="text-sm font-semibold text-[#2C2420]">
                        ${match.price.toLocaleString()}/mo
                      </span>
                    )}
                    {match.no_fee && (
                      <span className="text-xs bg-[#F5E8DC] text-[#C4703A] px-2 py-0.5 rounded-full font-medium">
                        No fee
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#9B8E82] shrink-0 ml-3 text-right leading-relaxed">
                    {match.listed_at && (
                      <div>Available {toEasternDate(match.listed_at)}</div>
                    )}
                    <div>Found {toEastern(match.found_at)}</div>
                  </div>
                </div>
              </div>
            </a>
          )
        })}

        {filtered.length === 0 && matches.length > 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
            <p className="text-sm text-[#6B5E52]">No matches with current filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
