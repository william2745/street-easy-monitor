'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { ListingMatch } from '@/types/database'

type SortField = 'found_at' | 'price'
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

export default function MatchList({
  matches,
  newRunStart,
  prevRunStart,
}: {
  matches: ListingMatch[]
  newRunStart: string | null
  prevRunStart: string | null
}) {
  const [sortField, setSortField] = useState<SortField>('found_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [bedroomFilter, setBedroomFilter] = useState<number | 'all'>('all')
  const [feeFilter, setFeeFilter] = useState<'all' | 'no_fee'>('all')

  // Get unique bedroom counts for filter dropdown
  const bedroomOptions = useMemo(() => {
    const set = new Set<number>()
    matches.forEach(m => { if (m.bedrooms != null) set.add(m.bedrooms) })
    return Array.from(set).sort()
  }, [matches])

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
      // found_at
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

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => toggleSort('found_at')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            sortField === 'found_at'
              ? 'bg-[#2C2420] text-white border-[#2C2420]'
              : 'bg-white text-[#6B5E52] border-[#E8E0D5] hover:bg-[#F0EBE1]'
          }`}
        >
          Date found{arrow('found_at')}
        </button>
        <button
          onClick={() => toggleSort('price')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            sortField === 'price'
              ? 'bg-[#2C2420] text-white border-[#2C2420]'
              : 'bg-white text-[#6B5E52] border-[#E8E0D5] hover:bg-[#F0EBE1]'
          }`}
        >
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

          return (
            <a
              key={match.id}
              href={match.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex bg-white rounded-xl shadow-[0_1px_4px_rgba(44,36,32,0.08)] hover:shadow-[0_4px_16px_rgba(44,36,32,0.12)] transition-shadow group overflow-hidden"
            >
              {/* Image */}
              <div className="relative w-36 sm:w-44 shrink-0 bg-[#F0EBE1]">
                {match.image_url ? (
                  <Image
                    src={match.image_url}
                    alt={match.address ?? 'Listing photo'}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#C4B5A4]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
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
                  <div className="text-xs text-[#6B5E52] mt-1">
                    {match.neighborhood && <span>{match.neighborhood}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {match.price != null && (
                      <span className="text-sm font-semibold text-[#2C2420]">
                        ${match.price.toLocaleString()}/mo
                      </span>
                    )}
                    <span className="text-xs text-[#6B5E52]">
                      {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms} BR`) : ''}
                    </span>
                    {match.no_fee && (
                      <span className="text-xs bg-[#F5E8DC] text-[#C4703A] px-2 py-0.5 rounded-full font-medium">
                        No fee
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#9B8E82] shrink-0 ml-3 text-right">
                    {toEastern(match.found_at)}
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
