import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow, addMinutes, isPast } from 'date-fns'
import { Monitor } from '@/types/database'
import RunNowButton from './RunNowButton'

function getNextRun(monitor: Monitor): string {
  if (!monitor.last_run_at) return 'Pending first scan'
  const next = addMinutes(new Date(monitor.last_run_at), monitor.scan_interval ?? 1440)
  if (isPast(next)) return 'Running soon…'
  return `Next scan ${formatDistanceToNow(next, { addSuffix: true })}`
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[#2C2420]">Monitors</h1>
        <Link
          href="/monitors/new"
          className="bg-[#C4703A] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors"
        >
          + New monitor
        </Link>
      </div>

      {(monitors ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <p className="text-[#6B5E52] mb-4">No monitors yet.</p>
          <Link href="/monitors/new" className="text-sm text-[#C4703A] hover:underline">
            Create your first monitor →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(monitors as Monitor[]).map(monitor => (
            <div
              key={monitor.id}
              className="bg-white rounded-2xl px-5 py-4 shadow-[0_1px_4px_rgba(44,36,32,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <Link href={`/monitors/${monitor.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[#2C2420] text-sm">{monitor.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${monitor.is_active ? 'bg-[#F5E8DC] text-[#C4703A]' : 'bg-[#F0EBE1] text-[#6B5E52]'}`}>
                      {monitor.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5E52] truncate">
                    {monitor.neighborhoods.join(', ')} · Up to ${monitor.max_price.toLocaleString()}/mo
                    {monitor.bedrooms?.length ? ` · ${monitor.bedrooms.map((b: number) => b === 0 ? 'Studio' : `${b}BR`).join('/')}` : ''}
                  </p>
                  <p className="text-xs text-[#6B5E52] mt-1.5">
                    {getNextRun(monitor)}
                    {monitor.last_run_at && (
                      <span className="text-[#E8E0D5] mx-1.5">·</span>
                    )}
                    {monitor.last_run_at && (
                      <span>Last scan {formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true })}</span>
                    )}
                  </p>
                </Link>

                <RunNowButton monitorId={monitor.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
