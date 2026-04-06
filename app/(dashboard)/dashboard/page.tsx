import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Monitor, ListingMatch } from '@/types/database'
import RunNowButton from '../monitors/RunNowButton'
import CountdownTimer from '@/components/CountdownTimer'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function intervalLabel(mins: number): string {
  if (mins < 60) return `Every ${mins}min`
  if (mins === 60) return 'Hourly'
  if (mins === 1440) return 'Daily'
  return `Every ${mins / 60}h`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  const [{ data: monitors }, { data: matches }] = await Promise.all([
    supabase.from('monitors').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('listing_matches').select('*').eq('user_id', user!.id).order('found_at', { ascending: false }).limit(50),
  ])
  const totalCount = (matches ?? []).length

  const todayCount = (matches ?? []).filter((m: ListingMatch) => new Date(m.found_at) > new Date(Date.now() - 86400000)).length
  const hasMonitors = (monitors ?? []).length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-warm-900">Dashboard</h1>
          <p className="text-sm text-warm-700 mt-1">
            {hasMonitors
              ? `${(monitors ?? []).filter((m: Monitor) => m.is_active).length} active monitors · ${totalCount} listings found`
              : 'Set up a monitor to start finding apartments'}
          </p>
        </div>
      </div>

      {/* Monitor cards */}
      {hasMonitors ? (
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {(monitors as Monitor[]).map(monitor => (
            <Link
              key={monitor.id}
              href={`/monitors/${monitor.id}`}
              className="bg-warm-50 rounded-xl p-5 border border-warm-400 hover:border-brand/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${monitor.is_active ? 'bg-brand' : 'bg-warm-500'}`}
                    style={monitor.is_active ? { animation: 'pulse-dot 3s ease-in-out infinite' } : undefined}
                  />
                  <span className="font-serif text-lg text-warm-900 group-hover:text-brand transition-colors">{monitor.name}</span>
                </div>
                {!monitor.is_active && (
                  <span className="text-xs text-warm-600 bg-warm-200 px-2 py-0.5 rounded">Paused</span>
                )}
              </div>
              <div className="text-sm text-warm-700 mb-3">{monitor.neighborhoods.join(', ')}</div>
              <div className="flex items-center gap-4 text-xs text-warm-600">
                <span>${monitor.max_price.toLocaleString()}/mo</span>
                <span>{intervalLabel(monitor.scan_interval ?? 1440)}</span>
                <span>Next: <CountdownTimer lastRunAt={monitor.last_run_at} scanInterval={monitor.scan_interval ?? 1440} /></span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-300">
                <span className="text-xs text-warm-600">
                  {monitor.last_run_at ? `Scanned ${relativeTime(monitor.last_run_at)}` : 'Not yet scanned'}
                </span>
                <RunNowButton monitorId={monitor.id} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-warm-50 rounded-xl p-12 border-2 border-dashed border-warm-400 text-center mb-10">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h2 className="font-serif text-xl text-warm-900 mb-2">Start monitoring StreetEasy</h2>
          <p className="text-sm text-warm-700 mb-5 max-w-sm mx-auto">
            Create your first monitor with neighborhoods, price range, and preferences. We&apos;ll scan StreetEasy and alert you instantly.
          </p>
          <Link href="/monitors/new" className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create your first monitor
          </Link>
        </div>
      )}

      {/* Match feed */}
      {(matches ?? []).length > 0 && (
        <>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-xl text-warm-900">Latest Listings</h2>
            {todayCount > 0 && (
              <span className="text-xs font-medium text-brand bg-brand-light border border-brand-medium px-2.5 py-1 rounded-full">
                +{todayCount} today
              </span>
            )}
          </div>

          <div className="bg-warm-50 rounded-xl border border-warm-400 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[90px_1fr_80px_64px_80px_28px] gap-3 px-5 py-3 bg-warm-200/50 border-b border-warm-400">
              <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Price</div>
              <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Address</div>
              <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Beds</div>
              <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Fee</div>
              <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider text-right">Found</div>
              <div></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-warm-400/50">
              {(matches as ListingMatch[]).map(match => {
                const isRecent = new Date(match.found_at) > new Date(Date.now() - 3600000)
                return (
                  <a
                    key={match.id}
                    href={match.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`grid grid-cols-[90px_1fr_80px_64px_80px_28px] gap-3 px-5 py-3.5 items-center transition-colors group ${
                      isRecent ? 'bg-brand-light/30' : 'hover:bg-warm-200/30'
                    }`}
                  >
                    <div className="text-[15px] font-semibold text-warm-900 tabular-nums">
                      {match.price != null ? `$${match.price.toLocaleString()}` : '—'}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-warm-800 truncate group-hover:text-brand transition-colors">
                        {match.address ?? match.neighborhood ?? 'NYC listing'}
                      </span>
                      {isRecent && (
                        <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded uppercase shrink-0">New</span>
                      )}
                    </div>
                    <div className="text-sm text-warm-700">
                      {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms} BR`) : '—'}
                    </div>
                    <div>
                      {match.no_fee
                        ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">NF</span>
                        : <span className="text-sm text-warm-600">—</span>}
                    </div>
                    <div className="text-sm text-warm-600 text-right tabular-nums">{relativeTime(match.found_at)}</div>
                    <div className="flex justify-end">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warm-500 group-hover:text-brand transition-colors" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
