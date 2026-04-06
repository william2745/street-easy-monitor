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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function MonitorsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-warm-900">Monitors</h1>
      </div>

      {(monitors ?? []).length === 0 ? (
        <div className="bg-warm-50 rounded-xl p-12 border-2 border-dashed border-warm-400 text-center">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <h2 className="font-serif text-xl text-warm-900 mb-2">No monitors yet</h2>
          <p className="text-sm text-warm-700 mb-5">Create a monitor to start tracking listings.</p>
          <Link href="/monitors/new" className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create monitor
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
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

              <div className="text-sm text-warm-700 mb-1">{monitor.neighborhoods.join(', ')}</div>
              <div className="text-sm text-warm-600">
                Up to ${monitor.max_price.toLocaleString()}/mo
                {(monitor.bedrooms?.length ?? 0) > 0 && (
                  <> · {monitor.bedrooms!.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join(', ')}</>
                )}
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-warm-300 text-xs text-warm-600">
                <span>{intervalLabel(monitor.scan_interval ?? 1440)}</span>
                <span>Next: {nextRun(monitor)}</span>
                {monitor.last_run_at && <span>Last: {relativeTime(monitor.last_run_at)}</span>}
                <div className="ml-auto" onClick={e => e.preventDefault()}>
                  <RunNowButton monitorId={monitor.id} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
