import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { addMinutes, isPast, formatDistanceToNow } from 'date-fns'
import { ListingMatch } from '@/types/database'
import MonitorControls from './MonitorControls'
import MatchList from '@/components/MatchList'

function toEastern(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' ET'
}

function nextRunLabel(lastRunAt: string | null, interval: number): string {
  if (!lastRunAt) return 'Pending'
  const next = addMinutes(new Date(lastRunAt), interval)
  if (isPast(next)) return 'Due now'
  return formatDistanceToNow(next, { addSuffix: true })
}

function intervalLabel(mins: number): string {
  if (mins < 60) return `Every ${mins} min`
  if (mins === 60) return 'Hourly'
  if (mins === 1440) return 'Daily'
  return `Every ${mins / 60}h`
}

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!monitor) notFound()

  const { data: lastRun } = await serviceSupabase
    .from('scraper_runs')
    .select('started_at')
    .eq('monitor_id', id)
    .eq('status', 'succeeded')
    .order('started_at', { ascending: false })
    .limit(2)

  const currentRunStart = lastRun?.[0]?.started_at ?? null
  const previousRunStart = lastRun?.[1]?.started_at ?? null

  const { data: matches } = await supabase
    .from('listing_matches')
    .select('*')
    .eq('monitor_id', id)
    .order('found_at', { ascending: false })
    .limit(200)

  const scanInterval = monitor.scan_interval ?? 1440
  const matchCount = (matches ?? []).length
  const noFeeCount = (matches ?? []).filter((m: ListingMatch) => m.no_fee).length
  const avgPrice = matchCount > 0
    ? Math.round((matches as ListingMatch[]).reduce((sum, m) => sum + (m.price ?? 0), 0) / matchCount)
    : 0

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link href="/monitors" className="text-xs text-zinc-400 hover:text-emerald-600 transition-colors mb-2 inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Monitors
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{monitor.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${monitor.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            <span className="text-sm text-zinc-500">
              {monitor.neighborhoods.join(', ')}
            </span>
          </div>
        </div>
        <MonitorControls monitor={monitor} />
      </div>

      {/* Criteria cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-zinc-200 px-4 py-3">
          <div className="text-xs text-zinc-400 mb-0.5">Max rent</div>
          <div className="text-sm font-semibold text-zinc-900">${monitor.max_price.toLocaleString()}/mo</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 px-4 py-3">
          <div className="text-xs text-zinc-400 mb-0.5">Bedrooms</div>
          <div className="text-sm font-semibold text-zinc-900">
            {monitor.bedrooms?.length ? monitor.bedrooms.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ') : 'Any'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 px-4 py-3">
          <div className="text-xs text-zinc-400 mb-0.5">Frequency</div>
          <div className="text-sm font-semibold text-zinc-900">{intervalLabel(scanInterval)}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 px-4 py-3">
          <div className="text-xs text-zinc-400 mb-0.5">Next scan</div>
          <div className="text-sm font-semibold text-zinc-900">{nextRunLabel(monitor.last_run_at, scanInterval)}</div>
          {monitor.last_run_at && (
            <div className="text-[11px] text-zinc-400 mt-0.5">Last: {toEastern(monitor.last_run_at)}</div>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {matchCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-5 text-sm">
          <span className="text-emerald-700"><strong className="font-semibold">{matchCount}</strong> listings</span>
          {avgPrice > 0 && (
            <span className="text-emerald-700">Avg <strong className="font-semibold">${avgPrice.toLocaleString()}</strong>/mo</span>
          )}
          {noFeeCount > 0 && (
            <span className="text-emerald-700"><strong className="font-semibold">{noFeeCount}</strong> no fee</span>
          )}
        </div>
      )}

      {/* Matches */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-zinc-900">Matches</h2>
      </div>

      {matchCount === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-10 text-center">
          <p className="text-sm text-zinc-500">No matches yet. Hit &quot;Scan now&quot; or wait for the next scheduled run.</p>
        </div>
      ) : (
        <MatchList
          matches={matches as ListingMatch[]}
          newRunStart={currentRunStart}
          prevRunStart={previousRunStart}
        />
      )}
    </div>
  )
}
