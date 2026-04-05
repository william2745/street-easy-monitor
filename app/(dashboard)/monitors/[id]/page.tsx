import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format, addMinutes, isPast } from 'date-fns'
import { ListingMatch } from '@/types/database'
import MonitorControls from './MonitorControls'

function getNextRun(lastRunAt: string | null, intervalMinutes: number): string {
  if (!lastRunAt) return 'Pending first scan'
  const next = addMinutes(new Date(lastRunAt), intervalMinutes)
  if (isPast(next)) return 'Running soon…'
  return `Next scan ${formatDistanceToNow(next, { addSuffix: true })}`
}

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!monitor) notFound()

  // Get last scraper run to identify "new" matches
  const { data: lastRun } = await supabase
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
    .limit(100)

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
              <> · Last scan {formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true })}</>
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
        <div className="space-y-2">
          {(matches as ListingMatch[]).map(match => {
            const isNew = currentRunStart
              ? new Date(match.found_at) >= new Date(currentRunStart)
              : false
            const isPrev = !isNew && previousRunStart
              ? new Date(match.found_at) >= new Date(previousRunStart)
              : false

            return (
              <a
                key={match.id}
                href={match.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-[0_1px_4px_rgba(44,36,32,0.08)] hover:shadow-[0_4px_16px_rgba(44,36,32,0.12)] transition-shadow group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isNew && (
                      <span className="text-xs bg-[#C4703A] text-white px-2 py-0.5 rounded-full font-medium shrink-0">NEW</span>
                    )}
                    <div className="text-sm font-medium text-[#2C2420] group-hover:text-[#C4703A] transition-colors truncate">
                      {match.address ?? match.neighborhood ?? 'NYC listing'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#6B5E52]">
                      {match.bedrooms != null ? (match.bedrooms === 0 ? 'Studio' : `${match.bedrooms}BR`) : ''}
                      {match.price ? ` · $${match.price.toLocaleString()}/mo` : ''}
                    </span>
                    {match.no_fee && <span className="text-xs bg-[#F5E8DC] text-[#C4703A] px-2 py-0.5 rounded-full">No fee</span>}
                    {match.pet_friendly && <span className="text-xs bg-[#F5E8DC] text-[#C4703A] px-2 py-0.5 rounded-full">Pets</span>}
                    {match.has_laundry && <span className="text-xs bg-[#F5E8DC] text-[#C4703A] px-2 py-0.5 rounded-full">Laundry</span>}
                  </div>
                </div>
                <div className="text-xs text-[#6B5E52] shrink-0 ml-4">
                  {format(new Date(match.found_at), 'MMM d, h:mm a')}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
