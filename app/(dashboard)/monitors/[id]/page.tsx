import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, addMinutes, isPast } from 'date-fns'
import { ListingMatch } from '@/types/database'
import MonitorControls from './MonitorControls'
import MatchList from '@/components/MatchList'

function getNextRun(lastRunAt: string | null, intervalMinutes: number): string {
  if (!lastRunAt) return 'Pending first scan'
  const next = addMinutes(new Date(lastRunAt), intervalMinutes)
  if (isPast(next)) return 'Running soon…'
  return `Next scan ${formatDistanceToNow(next, { addSuffix: true })}`
}

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

  // Use service client for scraper_runs (RLS has no user policy)
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

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/monitors" className="text-xs text-[#6B5E52] hover:text-[#C4703A] mb-2 block">
            ← Monitors
          </Link>
          <h1 className="font-serif text-3xl text-[#2C2420]">{monitor.name}</h1>
          <p className="text-sm text-[#6B5E52] mt-1">
            {monitor.neighborhoods.join(', ')} · Up to ${monitor.max_price.toLocaleString()}/mo
          </p>
        </div>
        <MonitorControls monitor={monitor} />
      </div>

      {/* Criteria + scan info */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(44,36,32,0.08)] mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <div className="text-xs text-[#6B5E52] mb-0.5">Bedrooms</div>
            <div className="text-[#2C2420]">
              {monitor.bedrooms?.length ? monitor.bedrooms.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ') : 'Any'}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6B5E52] mb-0.5">Max rent</div>
            <div className="text-[#2C2420]">${monitor.max_price.toLocaleString()}/mo</div>
          </div>
          <div>
            <div className="text-xs text-[#6B5E52] mb-0.5">Scan frequency</div>
            <div className="text-[#2C2420]">
              {scanInterval < 60 ? `Every ${scanInterval}min` : scanInterval === 60 ? 'Every hour' : scanInterval === 1440 ? 'Daily' : `Every ${scanInterval / 60}h`}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6B5E52] mb-0.5">Status</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${monitor.is_active ? 'bg-[#F5E8DC] text-[#C4703A]' : 'bg-[#F0EBE1] text-[#6B5E52]'}`}>
              {monitor.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
        <div className="border-t border-[#F0EBE1] pt-3 flex items-center justify-between">
          <p className="text-xs text-[#6B5E52]">
            {getNextRun(monitor.last_run_at, scanInterval)}
            {monitor.last_run_at && (
              <> · Last scan {toEastern(monitor.last_run_at)}</>
            )}
          </p>
        </div>
      </div>

      {/* Matches */}
      <h2 className="font-medium text-[#2C2420] mb-3">
        Matches <span className="text-[#6B5E52] font-normal">({(matches ?? []).length})</span>
      </h2>

      {(matches ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <p className="text-[#6B5E52]">No matches yet. Use &quot;Check now&quot; or wait for the next scan.</p>
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
