import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow, addMinutes, isPast } from 'date-fns'
import { Monitor } from '@/types/database'
import RunNowButton from './RunNowButton'

function nextRun(m: Monitor): string {
  if (!m.last_run_at) return 'Awaiting first scan'
  const next = addMinutes(new Date(m.last_run_at), m.scan_interval ?? 1440)
  if (isPast(next)) return 'Due now'
  return `in ${formatDistanceToNow(next)}`
}

function intervalLabel(mins: number): string {
  if (mins < 60) return `Every ${mins}min`
  if (mins === 60) return 'Hourly'
  if (mins === 1440) return 'Daily'
  return `Every ${mins / 60}h`
}

export default async function MonitorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[15px] font-semibold text-zinc-900">Monitors</h1>
      </div>

      {(monitors ?? []).length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-16 text-center">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </div>
          <p className="text-[13px] text-zinc-500 mb-4">No monitors yet</p>
          <Link href="/monitors/new" className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-md text-[13px] font-medium hover:bg-violet-500 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create monitor
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100">
          {(monitors as Monitor[]).map(monitor => (
            <div key={monitor.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
              <span className={`w-2 h-2 rounded-full shrink-0 ${monitor.is_active ? 'bg-violet-500' : 'bg-zinc-300'}`} />
              <Link href={`/monitors/${monitor.id}`} className="flex-1 min-w-0 group">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-zinc-900 group-hover:text-violet-600 transition-colors">{monitor.name}</span>
                  {!monitor.is_active && <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Paused</span>}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  {monitor.neighborhoods.join(', ')} &middot; ${monitor.max_price.toLocaleString()}/mo
                  {(monitor.bedrooms?.length ?? 0) > 0 && <> &middot; {monitor.bedrooms!.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ')}</>}
                </div>
              </Link>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-[11px] text-zinc-400">{intervalLabel(monitor.scan_interval ?? 1440)}</div>
                  <div className="text-[11px] text-zinc-300 mt-0.5">
                    {monitor.last_run_at ? `Last ${formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true })}` : '—'}
                  </div>
                </div>
                <RunNowButton monitorId={monitor.id} />
                <Link href={`/monitors/${monitor.id}`} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
