import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { ListingMatch } from '@/types/database'
import MonitorControls from './MonitorControls'

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

  const { data: matches } = await supabase
    .from('listing_matches')
    .select('*')
    .eq('monitor_id', id)
    .order('found_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-xs text-[#6B5E52] hover:text-[#C4703A] mb-2 block">
            ← Dashboard
          </Link>
          <h1 className="font-serif text-3xl text-[#2C2420]">{monitor.name}</h1>
          <p className="text-sm text-[#6B5E52] mt-1">
            {monitor.neighborhoods.join(', ')} · Up to ${monitor.max_price.toLocaleString()}/mo
            {monitor.no_fee ? ' · No fee' : ''}
            {monitor.pet_friendly ? ' · Pets ok' : ''}
          </p>
        </div>
        <MonitorControls monitor={monitor} />
      </div>

      {/* Criteria summary */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(44,36,32,0.08)] mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
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
            <div className="text-xs text-[#6B5E52] mb-0.5">Status</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${monitor.is_active ? 'bg-[#F5E8DC] text-[#C4703A]' : 'bg-[#F0EBE1] text-[#6B5E52]'}`}>
              {monitor.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          <div>
            <div className="text-xs text-[#6B5E52] mb-0.5">Last scan</div>
            <div className="text-[#2C2420]">
              {monitor.last_run_at ? formatDistanceToNow(new Date(monitor.last_run_at), { addSuffix: true }) : 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Matches */}
      <h2 className="font-medium text-[#2C2420] mb-3">
        Matches <span className="text-[#6B5E52] font-normal">({(matches ?? []).length})</span>
      </h2>

      {(matches ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
          <p className="text-[#6B5E52]">No matches yet. Scans run automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(matches as ListingMatch[]).map(match => (
            <a
              key={match.id}
              href={match.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-[0_1px_4px_rgba(44,36,32,0.08)] hover:shadow-[0_4px_16px_rgba(44,36,32,0.12)] transition-shadow group"
            >
              <div>
                <div className="text-sm font-medium text-[#2C2420] group-hover:text-[#C4703A] transition-colors">
                  {match.address ?? match.neighborhood ?? 'NYC listing'}
                </div>
                <div className="flex items-center gap-3 mt-1">
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
          ))}
        </div>
      )}
    </div>
  )
}
