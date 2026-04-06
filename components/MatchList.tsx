'use client'

import { useState, useMemo } from 'react'
import { ListingMatch } from '@/types/database'

type SortField = 'found_at' | 'listed_at' | 'price'
type SortDir = 'asc' | 'desc'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function toEasternDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
  })
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
    if (bedroomFilter !== 'all') result = result.filter(m => m.bedrooms === bedroomFilter)
    if (feeFilter === 'no_fee') result = result.filter(m => m.no_fee === true)

    result.sort((a, b) => {
      if (sortField === 'price') {
        return sortDir === 'asc' ? (a.price ?? 0) - (b.price ?? 0) : (b.price ?? 0) - (a.price ?? 0)
      }
      if (sortField === 'listed_at') {
        const da = a.listed_at ? new Date(a.listed_at).getTime() : 0
        const db = b.listed_at ? new Date(b.listed_at).getTime() : 0
        return sortDir === 'asc' ? da - db : db - da
      }
      return sortDir === 'asc'
        ? new Date(a.found_at).getTime() - new Date(b.found_at).getTime()
        : new Date(b.found_at).getTime() - new Date(a.found_at).getTime()
    })
    return result
  }, [matches, sortField, sortDir, bedroomFilter, feeFilter])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'price' ? 'asc' : 'desc') }
  }

  const arrow = (field: SortField) => sortField === field ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''

  const pillCls = (field: SortField) =>
    `text-[11px] px-2 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
      sortField === field
        ? 'bg-zinc-900 text-white border-zinc-900'
        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
    }`

  return (
    <div>
      {/* Compact toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <button onClick={() => toggleSort('found_at')} className={pillCls('found_at')}>Found{arrow('found_at')}</button>
        {hasListedAt && <button onClick={() => toggleSort('listed_at')} className={pillCls('listed_at')}>Available{arrow('listed_at')}</button>}
        <button onClick={() => toggleSort('price')} className={pillCls('price')}>Price{arrow('price')}</button>

        <div className="w-px h-4 bg-zinc-200 mx-0.5" />

        <select
          value={bedroomFilter === 'all' ? 'all' : String(bedroomFilter)}
          onChange={e => setBedroomFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-600 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All beds</option>
          {bedroomOptions.map(b => <option key={b} value={b}>{b === 0 ? 'Studio' : `${b}BR`}</option>)}
        </select>

        <select
          value={feeFilter}
          onChange={e => setFeeFilter(e.target.value as 'all' | 'no_fee')}
          className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-600 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Any fee</option>
          <option value="no_fee">No fee only</option>
        </select>

        <span className="text-[11px] text-zinc-400 ml-auto tabular-nums">{filtered.length}/{matches.length}</span>
      </div>

      {/* Rows */}
      <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        {filtered.map(match => {
          const isNew = newRunStart ? new Date(match.found_at) >= new Date(newRunStart) : false

          return (
            <a
              key={match.id}
              href={match.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center px-4 py-3 transition-colors group ${isNew ? 'bg-emerald-50/40' : 'hover:bg-zinc-50'}`}
            >
              <div className="w-[72px] shrink-0 mr-3">
                <div className="text-[15px] font-bold text-zinc-900 tabular-nums leading-tight">
                  {match.price != null ? `$${match.price.toLocaleString()}` : '—'}
                </div>
                <div className="text-[10px] text-zinc-400">/mo</div>
              </div>

              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                    {match.address ?? match.neighborhood ?? 'NYC listing'}
                  </span>
                  {isNew && (
                    <span className="text-[9px] font-bold bg-emerald-600 text-white px-1 py-px rounded uppercase leading-none shrink-0">new</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-zinc-400">{match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms}BR`) : ''}</span>
                  {match.no_fee && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-px rounded font-semibold">No fee</span>}
                  {match.neighborhood && match.address && <span className="text-[11px] text-zinc-300">{match.neighborhood}</span>}
                </div>
              </div>

              <div className="text-right shrink-0 mr-2">
                <div className="text-[11px] text-zinc-400 tabular-nums">{relativeTime(match.found_at)}</div>
                {match.listed_at && <div className="text-[10px] text-zinc-300">Avail {toEasternDate(match.listed_at)}</div>}
              </div>

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 group-hover:text-emerald-500 shrink-0 transition-colors" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-zinc-400">No matches with current filters</div>
        )}
      </div>
    </div>
  )
}
