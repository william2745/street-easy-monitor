'use client'

import { useState, useMemo } from 'react'
import { ListingMatch } from '@/types/database'

type SortField = 'found_at' | 'listed_at' | 'price'
type SortDir = 'asc' | 'desc'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric',
  })
}

export default function MatchList({
  matches, newRunStart,
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
    const s = new Set<number>()
    matches.forEach(m => { if (m.bedrooms != null) s.add(m.bedrooms) })
    return Array.from(s).sort()
  }, [matches])

  const hasListedAt = matches.some(m => m.listed_at != null)

  const filtered = useMemo(() => {
    let r = [...matches]
    if (bedroomFilter !== 'all') r = r.filter(m => m.bedrooms === bedroomFilter)
    if (feeFilter === 'no_fee') r = r.filter(m => m.no_fee === true)
    r.sort((a, b) => {
      if (sortField === 'price') return sortDir === 'asc' ? (a.price ?? 0) - (b.price ?? 0) : (b.price ?? 0) - (a.price ?? 0)
      if (sortField === 'listed_at') {
        const da = a.listed_at ? new Date(a.listed_at).getTime() : 0, db = b.listed_at ? new Date(b.listed_at).getTime() : 0
        return sortDir === 'asc' ? da - db : db - da
      }
      return sortDir === 'asc' ? new Date(a.found_at).getTime() - new Date(b.found_at).getTime() : new Date(b.found_at).getTime() - new Date(a.found_at).getTime()
    })
    return r
  }, [matches, sortField, sortDir, bedroomFilter, feeFilter])

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir(f === 'price' ? 'asc' : 'desc') }
  }

  const arrow = (f: SortField) => sortField === f ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''
  const pillCls = (f: SortField) =>
    `text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
      sortField === f
        ? 'bg-brand text-white border-brand shadow-sm'
        : 'bg-warm-50 text-warm-700 border-warm-400 hover:border-brand/40 hover:text-brand'
    }`

  const colCount = hasListedAt ? 7 : 6
  const gridCols = hasListedAt
    ? 'grid-cols-[90px_1fr_80px_64px_72px_80px_28px]'
    : 'grid-cols-[90px_1fr_80px_64px_80px_28px]'

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-warm-600 uppercase tracking-wider mr-1">Sort</span>
        <button onClick={() => toggleSort('found_at')} className={pillCls('found_at')}>Found{arrow('found_at')}</button>
        {hasListedAt && <button onClick={() => toggleSort('listed_at')} className={pillCls('listed_at')}>Available{arrow('listed_at')}</button>}
        <button onClick={() => toggleSort('price')} className={pillCls('price')}>Price{arrow('price')}</button>

        <div className="w-px h-5 bg-warm-400 mx-1" />

        <select value={bedroomFilter === 'all' ? 'all' : String(bedroomFilter)} onChange={e => setBedroomFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="text-xs px-2.5 py-1 rounded-lg border border-warm-400 bg-warm-50 text-warm-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
          <option value="all">All beds</option>
          {bedroomOptions.map(b => <option key={b} value={b}>{b === 0 ? 'Studio' : `${b} BR`}</option>)}
        </select>

        <select value={feeFilter} onChange={e => setFeeFilter(e.target.value as 'all' | 'no_fee')}
          className="text-xs px-2.5 py-1 rounded-lg border border-warm-400 bg-warm-50 text-warm-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
          <option value="all">Any fee</option>
          <option value="no_fee">No fee only</option>
        </select>

        <span className="text-xs text-warm-600 ml-auto tabular-nums">{filtered.length} of {matches.length}</span>
      </div>

      {/* Table */}
      <div className="bg-warm-50 rounded-xl border border-warm-400 overflow-hidden">
        <div className={`grid ${gridCols} gap-3 px-5 py-3 bg-warm-200/50 border-b border-warm-400`}>
          <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Price</div>
          <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Address</div>
          <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Beds</div>
          <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Fee</div>
          {hasListedAt && <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Avail</div>}
          <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider text-right">Found</div>
          <div></div>
        </div>

        <div className="divide-y divide-warm-400/50">
          {filtered.map(match => {
            const isNew = newRunStart ? new Date(match.found_at) >= new Date(newRunStart) : false
            return (
              <a
                key={match.id}
                href={match.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`grid ${gridCols} gap-3 px-5 py-3.5 items-center transition-colors group ${
                  isNew ? 'bg-brand-light/40' : 'hover:bg-warm-200/30'
                }`}
              >
                <div className="text-[15px] font-semibold text-warm-900 tabular-nums">
                  {match.price != null ? `$${match.price.toLocaleString()}` : '—'}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-warm-800 truncate group-hover:text-brand transition-colors">
                    {match.address ?? match.neighborhood ?? 'NYC listing'}
                  </span>
                  {isNew && <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded uppercase shrink-0">New</span>}
                </div>
                <div className="text-sm text-warm-700">
                  {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms} BR`) : '—'}
                </div>
                <div>
                  {match.no_fee
                    ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">NF</span>
                    : <span className="text-sm text-warm-600">—</span>}
                </div>
                {hasListedAt && (
                  <div className="text-sm text-warm-600 tabular-nums">{match.listed_at ? shortDate(match.listed_at) : '—'}</div>
                )}
                <div className="text-sm text-warm-600 text-right tabular-nums">{relativeTime(match.found_at)}</div>
                <div className="flex justify-end">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warm-500 group-hover:text-brand transition-colors" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              </a>
            )
          })}
          {filtered.length === 0 && (
            <div className={`grid ${gridCols} px-5 py-8`}>
              <div className={`col-span-${colCount} text-center text-sm text-warm-600`}>No matches with current filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
