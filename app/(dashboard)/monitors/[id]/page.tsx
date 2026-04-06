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
  if (!lastRunAt) return 'Pending'
  const next = addMinutes(new Date(lastRunAt), interval)
  if (isPast(next)) return 'Due now'
  return formatDistanceToNow(next, { addSuffix: true })
}

function intervalLabel(mins: number): string {
  if (mins < 60) return `${mins}min`
  if (mins === 60) return 'Hourly'
  if (mins === 1440) return 'Daily'
  return `${mins / 60}h`
}

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

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
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <Link href="/monitors" className="text-[11px] text-zinc-400 hover:text-violet-600 transition-colors mb-1 inline-flex items-center gap-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Monitors
          </Link>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${monitor.is_active ? 'bg-violet-500' : 'bg-zinc-300'}`} />
            <h1 className="text-[15px] font-semibold text-zinc-900">{monitor.name}</h1>
          </div>
          <div className="text-[12px] text-zinc-400 mt-0.5">{monitor.neighborhoods.join(', ')}</div>
        </div>
        <MonitorControls monitor={monitor} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-px bg-zinc-200 rounded-lg overflow-hidden mb-5 border border-zinc-200">
        {[
          { label: 'Max rent', value: `$${monitor.max_price.toLocaleString()}` },
          { label: 'Beds', value: monitor.bedrooms?.length ? monitor.bedrooms.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ') : 'Any' },
          { label: 'Frequency', value: intervalLabel(scanInterval) },
          { label: 'Next scan', value: nextRunLabel(monitor.last_run_at, scanInterval) },
          { label: 'Last scan', value: monitor.last_run_at ? toEastern(monitor.last_run_at) : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white px-3 py-2.5">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{s.label}</div>
            <div className="text-[13px] font-medium text-zinc-900 mt-0.5 truncate">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {matchCount > 0 && (
        <div className="flex items-center gap-4 mb-4 text-[12px]">
          <span className="text-zinc-500"><strong className="text-zinc-900 font-semibold">{matchCount}</strong> listings</span>
          {avgPrice > 0 && <span className="text-zinc-500">avg <strong className="text-zinc-900 font-semibold">${avgPrice.toLocaleString()}</strong>/mo</span>}
          {noFeeCount > 0 && <span className="text-zinc-500"><strong className="text-zinc-900 font-semibold">{noFeeCount}</strong> no fee</span>}
        </div>
      )}

      {/* Matches */}
      {matchCount === 0 ? (
        <div className="border border-zinc-200 rounded-lg p-8 text-center">
          <p className="text-[13px] text-zinc-400">No matches yet. Hit &quot;Scan now&quot; to start.</p>
        </div>
      ) : (
        <MatchList matches={matches as ListingMatch[]} newRunStart={currentRunStart} prevRunStart={previousRunStart} />
      )}
    </div>
  )
}
