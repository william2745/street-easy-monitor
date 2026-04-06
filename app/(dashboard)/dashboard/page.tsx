import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow, addMinutes, isPast } from 'date-fns'
import { Monitor, ListingMatch } from '@/types/database'
import RunNowButton from '../monitors/RunNowButton'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function intervalLabel(mins: number): string {
  if (mins < 60) return `${mins}m`
  if (mins === 60) return '1h'
  if (mins === 1440) return '24h'
  return `${mins / 60}h`
}

function nextScanLabel(monitor: Monitor): string {
  if (!monitor.last_run_at) return 'pending'
  const next = addMinutes(new Date(monitor.last_run_at), monitor.scan_interval ?? 1440)
  if (isPast(next)) return 'due'
  return `in ${formatDistanceToNow(next)}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: monitors }, { data: allMatches }, { count: totalCount }] = await Promise.all([
    supabase.from('monitors').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase
      .from('listing_matches')
      .select('*')
      .eq('user_id', user!.id)
      .order('found_at', { ascending: false })
      .limit(100),
    supabase
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  const todayCount = (allMatches ?? []).filter((m: ListingMatch) =>
    new Date(m.found_at) > new Date(Date.now() - 86400000)
  ).length
  const hasMonitors = (monitors ?? []).length > 0
  const hasMatches = (allMatches ?? []).length > 0

  return (
    <div>
      {/* Monitor status strip */}
      {hasMonitors && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-0.5">
          {(monitors as Monitor[]).map(monitor => (
            <div key={monitor.id} className="flex items-center gap-2 shrink-0 bg-zinc-50 border border-zinc-100 rounded-md px-2.5 py-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${monitor.is_active ? 'bg-violet-500' : 'bg-zinc-300'}`}
                style={monitor.is_active ? { animation: 'live-pulse 3s ease-in-out infinite' } : undefined}
              />
              <Link href={`/monitors/${monitor.id}`} className="text-[12px] font-medium text-zinc-700 hover:text-violet-600 transition-colors whitespace-nowrap">
                {monitor.name}
              </Link>
              <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                {monitor.last_run_at ? relativeTime(monitor.last_run_at) + ' ago' : '—'}
              </span>
              <span className="text-[10px] text-zinc-300 font-mono">{intervalLabel(monitor.scan_interval ?? 1440)}</span>
              <span className="text-[10px] text-zinc-300">next {nextScanLabel(monitor)}</span>
              <RunNowButton monitorId={monitor.id} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasMonitors && (
        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-16 text-center">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-1">Start monitoring StreetEasy</h2>
          <p className="text-[13px] text-zinc-500 mb-4 max-w-xs mx-auto">
            Set your neighborhoods, price range, and preferences. We&apos;ll scan StreetEasy and alert you instantly.
          </p>
          <Link
            href="/monitors/new"
            className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-md text-[13px] font-medium hover:bg-violet-500 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create your first monitor
          </Link>
        </div>
      )}

      {/* Feed header */}
      {hasMonitors && (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Listings</span>
          <span className="text-[12px] text-zinc-300 tabular-nums">{totalCount ?? 0}</span>
          {todayCount > 0 && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full">
              +{todayCount} today
            </span>
          )}
        </div>
      )}

      {/* Data table */}
      {hasMatches && (
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[80px]">Price</th>
                <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2">Address</th>
                <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[72px]">Beds</th>
                <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[64px]">Fee</th>
                <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 w-[48px]">When</th>
                <th className="w-[32px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(allMatches as ListingMatch[]).map(match => {
                const isRecent = new Date(match.found_at) > new Date(Date.now() - 3600000)
                return (
                  <tr key={match.id} className={`group hover:bg-zinc-50 transition-colors ${isRecent ? 'bg-violet-50/30' : ''}`}>
                    <td className="px-3 py-2.5">
                      <a href={match.listing_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-zinc-900 tabular-nums">
                        {match.price != null ? `$${match.price.toLocaleString()}` : '—'}
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      <a href={match.listing_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[13px] text-zinc-700 truncate group-hover:text-violet-600 transition-colors">
                          {match.address ?? match.neighborhood ?? 'NYC listing'}
                        </span>
                        {isRecent && (
                          <span className="text-[9px] font-bold bg-violet-600 text-white px-1 py-px rounded uppercase shrink-0 tracking-wide">new</span>
                        )}
                        {match.neighborhood && match.address && (
                          <span className="text-[11px] text-zinc-300 shrink-0 hidden sm:inline">{match.neighborhood}</span>
                        )}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-zinc-500">
                      {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms}BR`) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {match.no_fee
                        ? <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">NF</span>
                        : <span className="text-[11px] text-zinc-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 text-right text-[12px] text-zinc-400 tabular-nums">
                      {relativeTime(match.found_at)}
                    </td>
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
            </tbody>
          </table>
        </div>
      )}

      {hasMonitors && !hasMatches && (
        <div className="border border-zinc-200 rounded-lg p-8 text-center">
          <p className="text-[13px] text-zinc-400">No listings found yet. Run a scan or wait for the next scheduled check.</p>
        </div>
      )}
    </div>
  )
}
