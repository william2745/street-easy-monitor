import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { formatDistanceToNow, addMinutes, isPast } from 'date-fns'
import { Monitor, ListingMatch } from '@/types/database'
import RunNowButton from '../monitors/RunNowButton'

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

function nextRunLabel(monitor: Monitor): string {
  if (!monitor.last_run_at) return 'Awaiting scan'
  const next = addMinutes(new Date(monitor.last_run_at), monitor.scan_interval ?? 1440)
  if (isPast(next)) return 'Due now'
  return `in ${formatDistanceToNow(next)}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: monitors }, { data: allMatches }, { count: totalCount }] = await Promise.all([
    supabase.from('monitors').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase
      .from('listing_matches')
      .select('*')
      .eq('user_id', user!.id)
      .order('found_at', { ascending: false })
      .limit(50),
    supabase
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  const todayCount = (allMatches ?? []).filter((m: ListingMatch) => new Date(m.found_at) > new Date(Date.now() - 86400000)).length

  return (
    <div>
      {/* Monitors strip — compact, always visible */}
      {(monitors ?? []).length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Your monitors</span>
            <Link href="/monitors/new" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(monitors as Monitor[]).map(monitor => (
              <Link
                key={monitor.id}
                href={`/monitors/${monitor.id}`}
                className="flex-none bg-white border border-zinc-200 rounded-lg px-3 py-2.5 hover:border-zinc-300 transition-colors min-w-[200px] max-w-[260px] group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${monitor.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                  <span className="text-xs font-medium text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">{monitor.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 truncate">
                    {monitor.neighborhoods.slice(0, 2).join(', ')}{monitor.neighborhoods.length > 2 ? ` +${monitor.neighborhoods.length - 2}` : ''} &middot; ${monitor.max_price.toLocaleString()}
                  </span>
                  <div onClick={e => e.preventDefault()}>
                    <RunNowButton monitorId={monitor.id} />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-300 mt-1">
                  {monitor.last_run_at ? `Scanned ${relativeTime(monitor.last_run_at)} · Next ${nextRunLabel(monitor)}` : 'Not scanned yet'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center mb-6">
          <p className="text-sm text-zinc-500 mb-2">Set up a monitor to start finding apartments</p>
          <Link href="/monitors/new" className="inline-flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create your first monitor
          </Link>
        </div>
      )}

      {/* Feed header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-900">Latest matches</h1>
          {todayCount > 0 && (
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
              {todayCount} new today
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-400 tabular-nums">{totalCount ?? 0} total</span>
      </div>

      {/* Match feed — the actual product */}
      {(allMatches ?? []).length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-400">No matches yet. Run a scan or wait for the next scheduled check.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {(allMatches as ListingMatch[]).map(match => {
            const isToday = new Date(match.found_at) > new Date(Date.now() - 86400000)
            return (
              <a
                key={match.id}
                href={match.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-4 py-3 hover:bg-zinc-50 transition-colors group ${isToday ? 'bg-emerald-50/30' : ''}`}
              >
                {/* Price */}
                <div className="w-[72px] shrink-0 mr-3">
                  <div className="text-[15px] font-bold text-zinc-900 tabular-nums leading-tight">
                    {match.price != null ? `$${match.price.toLocaleString()}` : '—'}
                  </div>
                  <div className="text-[10px] text-zinc-400">/mo</div>
                </div>

                {/* Listing info */}
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                      {match.address ?? match.neighborhood ?? 'NYC listing'}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold bg-emerald-600 text-white px-1 py-px rounded uppercase leading-none shrink-0">new</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-zinc-400">
                      {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms}BR`) : ''}
                    </span>
                    {match.no_fee && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-px rounded font-semibold">No fee</span>
                    )}
                    {match.neighborhood && match.address && (
                      <span className="text-[11px] text-zinc-300">{match.neighborhood}</span>
                    )}
                  </div>
                </div>

                {/* Timing */}
                <div className="text-right shrink-0 mr-2">
                  <div className="text-[11px] text-zinc-400 tabular-nums">{relativeTime(match.found_at)}</div>
                  {match.listed_at && (
                    <div className="text-[10px] text-zinc-300">Avail {toEasternDate(match.listed_at)}</div>
                  )}
                </div>

                {/* Arrow */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 group-hover:text-emerald-500 shrink-0 transition-colors" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
