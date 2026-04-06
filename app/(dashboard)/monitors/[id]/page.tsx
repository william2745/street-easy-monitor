import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { addMinutes, isPast, formatDistanceToNow } from 'date-fns'
import { ListingMatch } from '@/types/database'
import MonitorControls from './MonitorControls'
import MatchList from '@/components/MatchList'

function toEastern(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' ET'
}

function nextRunLabel(lastRunAt: string | null, interval: number): string {
  if (!lastRunAt) return 'Pending first scan'
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
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  const { data: monitor } = await supabase.from('monitors').select('*').eq('id', id).eq('user_id', user!.id).single()
  if (!monitor) notFound()

  const { data: lastRun } = await serviceSupabase
    .from('scraper_runs').select('started_at').eq('monitor_id', id).eq('status', 'succeeded')
    .order('started_at', { ascending: false }).limit(2)

  const currentRunStart = lastRun?.[0]?.started_at ?? null
  const previousRunStart = lastRun?.[1]?.started_at ?? null

  const { data: matches } = await supabase
    .from('listing_matches').select('*').eq('monitor_id', id)
    .order('found_at', { ascending: false }).limit(200)

  const scanInterval = monitor.scan_interval ?? 1440
  const matchCount = (matches ?? []).length
  const noFeeCount = (matches ?? []).filter((m: ListingMatch) => m.no_fee).length
  const avgPrice = matchCount > 0 ? Math.round((matches as ListingMatch[]).reduce((s, m) => s + (m.price ?? 0), 0) / matchCount) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/monitors" className="text-sm text-warm-600 hover:text-brand transition-colors mb-3 inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Monitors
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`w-3 h-3 rounded-full ${monitor.is_active ? 'bg-brand' : 'bg-warm-500'}`}
                style={monitor.is_active ? { animation: 'pulse-dot 3s ease-in-out infinite' } : undefined} />
              <h1 className="font-serif text-3xl text-warm-900">{monitor.name}</h1>
            </div>
            <p className="text-sm text-warm-700">{monitor.neighborhoods.join(', ')}</p>
          </div>
          <MonitorControls monitor={monitor} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-warm-400 rounded-xl overflow-hidden border border-warm-400 mb-8">
        {[
          { label: 'Max Rent', value: `$${monitor.max_price.toLocaleString()}/mo` },
          { label: 'Bedrooms', value: monitor.bedrooms?.length ? monitor.bedrooms.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ') : 'Any' },
          { label: 'Frequency', value: intervalLabel(scanInterval) },
          { label: 'Next Scan', value: nextRunLabel(monitor.last_run_at, scanInterval) },
          { label: 'Last Scan', value: monitor.last_run_at ? toEastern(monitor.last_run_at) : 'Never' },
        ].map(stat => (
          <div key={stat.label} className="bg-warm-50 px-4 py-3.5">
            <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-sm font-medium text-warm-900 truncate">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick summary */}
      {matchCount > 0 && (
        <div className="flex items-center gap-6 mb-6 text-sm text-warm-700">
          <span><strong className="text-warm-900 font-semibold">{matchCount}</strong> listings found</span>
          {avgPrice > 0 && <span>Avg <strong className="text-warm-900 font-semibold">${avgPrice.toLocaleString()}</strong>/mo</span>}
          {noFeeCount > 0 && <span><strong className="text-warm-900 font-semibold">{noFeeCount}</strong> no fee</span>}
        </div>
      )}

      {/* Matches */}
      <h2 className="font-serif text-xl text-warm-900 mb-4">Matches</h2>

      {matchCount === 0 ? (
        <div className="bg-warm-50 rounded-xl p-10 border border-warm-400 text-center">
          <p className="text-sm text-warm-700">No matches yet. Hit &quot;Scan now&quot; to check or wait for the next scheduled run.</p>
        </div>
      ) : (
        <MatchList matches={matches as ListingMatch[]} newRunStart={currentRunStart} prevRunStart={previousRunStart} />
      )}
    </div>
  )
}
