import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { Monitor, ListingMatch } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: monitors }, { data: recentMatches }] = await Promise.all([
    supabase.from('monitors').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase
      .from('listing_matches')
      .select('*')
      .eq('user_id', user!.id)
      .order('found_at', { ascending: false })
      .limit(10),
  ])

  const activeMonitors = (monitors ?? []).filter((m: Monitor) => m.is_active)
  const totalMatches = (recentMatches ?? []).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#2C2420]">Dashboard</h1>
          <p className="text-sm text-[#6B5E52] mt-1">
            {activeMonitors.length} active monitor{activeMonitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/monitors/new"
          className="bg-[#C4703A] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors"
        >
          + New monitor
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active monitors', value: activeMonitors.length },
          { label: 'Matches (today)', value: (recentMatches ?? []).filter((m: ListingMatch) => new Date(m.found_at) > new Date(Date.now() - 86400000)).length },
          { label: 'Total matches', value: totalMatches },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
            <div className="text-2xl font-semibold text-[#2C2420] mb-1">{stat.value}</div>
            <div className="text-xs text-[#6B5E52]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Monitors */}
      <h2 className="font-medium text-[#2C2420] mb-3">Your monitors</h2>
      {(monitors ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <p className="text-[#6B5E52] mb-4">No monitors yet.</p>
          <Link href="/monitors/new" className="text-sm text-[#C4703A] hover:underline">
            Create your first monitor →
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {(monitors as Monitor[]).map(monitor => (
            <Link
              key={monitor.id}
              href={`/monitors/${monitor.id}`}
              className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-[0_1px_4px_rgba(44,36,32,0.08)] hover:shadow-[0_4px_16px_rgba(44,36,32,0.12)] transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#2C2420] text-sm">{monitor.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${monitor.is_active ? 'bg-[#F5E8DC] text-[#C4703A]' : 'bg-[#F0EBE1] text-[#6B5E52]'}`}>
                    {monitor.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-[#6B5E52] mt-1">
                  {monitor.neighborhoods.join(', ')} · Up to ${monitor.max_price.toLocaleString()}/mo
                </p>
              </div>
              <div className="text-xs text-[#6B5E52]">
                {monitor.last_run_at
                  ? `Last scan ${formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true })}`
                  : 'Not yet scanned'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent matches */}
      {(recentMatches ?? []).length > 0 && (
        <>
          <h2 className="font-medium text-[#2C2420] mb-3">Recent matches</h2>
          <div className="space-y-2">
            {(recentMatches as ListingMatch[]).map(match => (
              <a
                key={match.id}
                href={match.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white rounded-xl px-5 py-3.5 shadow-[0_1px_4px_rgba(44,36,32,0.08)] hover:shadow-[0_4px_16px_rgba(44,36,32,0.12)] transition-shadow"
              >
                <div>
                  <div className="text-sm font-medium text-[#2C2420]">
                    {match.address ?? match.neighborhood ?? 'NYC listing'}
                  </div>
                  <div className="text-xs text-[#6B5E52] mt-0.5">
                    {match.bedrooms != null ? `${match.bedrooms}BR` : 'Studio'}
                    {match.price ? ` · $${match.price.toLocaleString()}/mo` : ''}
                    {match.no_fee ? ' · No fee' : ''}
                  </div>
                </div>
                <div className="text-xs text-[#6B5E52]">
                  {formatDistanceToNow(new Date(match.found_at), { addSuffix: true })}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
