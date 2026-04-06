'use client'

import { useState, useMemo } from 'react'
import { ListingMatch } from '@/types/database'

type SortField = 'found_at' | 'listed_at' | 'price'
type SortDir = 'asc' | 'desc'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
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
        const da = a.listed_at ? new Date(a.listed_at).getTime() : 0
        const db = b.listed_at ? new Date(b.listed_at).getTime() : 0
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
  const pill = (f: SortField) => `text-[11px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-medium ${
    sortField === f ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-500 border-zinc-200 hover:border-zinc-300'
  }`

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <button onClick={() => toggleSort('found_at')} className={pill('found_at')}>Found{arrow('found_at')}</button>
        {hasListedAt && <button onClick={() => toggleSort('listed_at')} className={pill('listed_at')}>Available{arrow('listed_at')}</button>}
        <button onClick={() => toggleSort('price')} className={pill('price')}>Price{arrow('price')}</button>
        <div className="w-px h-3 bg-zinc-200 mx-0.5" />
        <select value={bedroomFilter === 'all' ? 'all' : String(bedroomFilter)} onChange={e => setBedroomFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="text-[11px] px-1.5 py-0.5 rounded border border-zinc-200 bg-white text-zinc-600 focus:outline-none focus:border-violet-400">
          <option value="all">All beds</option>
          {bedroomOptions.map(b => <option key={b} value={b}>{b === 0 ? 'Studio' : `${b}BR`}</option>)}
        </select>
        <select value={feeFilter} onChange={e => setFeeFilter(e.target.value as 'all' | 'no_fee')}
          className="text-[11px] px-1.5 py-0.5 rounded border border-zinc-200 bg-white text-zinc-600 focus:outline-none focus:border-violet-400">
          <option value="all">Any fee</option>
          <option value="no_fee">No fee</option>
        </select>
        <span className="text-[11px] text-zinc-400 ml-auto tabular-nums">{filtered.length}/{matches.length}</span>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[80px]">Price</th>
              <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2">Address</th>
              <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[72px]">Beds</th>
              <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[56px]">Fee</th>
              {hasListedAt && <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[64px]">Avail</th>}
              <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[48px]">Found</th>
              <th className="w-[28px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map(match => {
              const isNew = newRunStart ? new Date(match.found_at) >= new Date(newRunStart) : false
              return (
                <tr key={match.id} className={`group hover:bg-zinc-50 transition-colors ${isNew ? 'bg-violet-50/30' : ''}`}>
                  <td className="px-3 py-2.5 text-[13px] font-semibold text-zinc-900 tabular-nums">
                    {match.price != null ? `$${match.price.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <a href={match.listing_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] text-zinc-700 truncate group-hover:text-violet-600 transition-colors">
                        {match.address ?? match.neighborhood ?? 'NYC listing'}
                      </span>
                      {isNew && <span className="text-[9px] font-bold bg-violet-600 text-white px-1 py-px rounded uppercase shrink-0">new</span>}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-zinc-500">
                    {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms}BR`) : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {match.no_fee
                      ? <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">NF</span>
                      : <span className="text-[11px] text-zinc-300">—</span>}
                  </td>
                  {hasListedAt && (
                    <td className="px-3 py-2.5 text-right text-[12px] text-zinc-400 tabular-nums">
                      {match.listed_at ? shortDate(match.listed_at) : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-right text-[12px] text-zinc-400 tabular-nums">{relativeTime(match.found_at)}</td>
                  <td className="px-2 py-2.5">
                    <a href={match.listing_url} target="_blank" rel="noopener noreferrer" className="text-zinc-200 group-hover:text-violet-500 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={hasListedAt ? 7 : 6} className="px-3 py-6 text-center text-[13px] text-zinc-400">No matches with current filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
