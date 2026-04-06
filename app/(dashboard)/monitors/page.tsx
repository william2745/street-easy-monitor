import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow, addMinutes, isPast } from 'date-fns'
import { Monitor } from '@/types/database'
import RunNowButton from './RunNowButton'

function getNextRun(monitor: Monitor): string {
  if (!monitor.last_run_at) return 'Awaiting first scan'
  const next = addMinutes(new Date(monitor.last_run_at), monitor.scan_interval ?? 1440)
  if (isPast(next)) return 'Due now'
  return formatDistanceToNow(next, { addSuffix: true })
}

function intervalLabel(mins: number): string {
  if (mins < 60) return `${mins}m`
  if (mins === 60) return '1h'
  if (mins === 1440) return '24h'
  return `${mins / 60}h`
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Monitors</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {(monitors ?? []).length} monitor{(monitors ?? []).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/monitors/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New monitor
        </Link>
      </div>

      {(monitors ?? []).length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <p className="text-sm text-zinc-500 mb-3">No monitors yet</p>
          <Link href="/monitors/new" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Create your first monitor
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(monitors as Monitor[]).map(monitor => (
            <div
              key={monitor.id}
              className="bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <Link href={`/monitors/${monitor.id}`} className="flex-1 min-w-0 flex items-center gap-3 group">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${monitor.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-zinc-900 group-hover:text-emerald-700 transition-colors">{monitor.name}</span>
                      {!monitor.is_active && (
                        <span className="text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Paused</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {monitor.neighborhoods.join(', ')} &middot; ${monitor.max_price.toLocaleString()}/mo
                      {(monitor.bedrooms?.length ?? 0) > 0 && (
                        <> &middot; {monitor.bedrooms!.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ')}</>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-zinc-400">{getNextRun(monitor)}</div>
                    {monitor.last_run_at && (
                      <div className="text-[11px] text-zinc-300 mt-0.5">
                        Last: {formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded font-mono">
                    {intervalLabel(monitor.scan_interval ?? 1440)}
                  </span>
                  <RunNowButton monitorId={monitor.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
