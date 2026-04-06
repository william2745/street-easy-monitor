import { createClient } from '@/lib/supabase/server'
import BillingActions from './BillingActions'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const isPro = sub?.plan === 'pro'

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Billing</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage your subscription</p>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Current plan</div>
            <div className="text-lg font-semibold text-zinc-900">{isPro ? 'Pro' : 'Free'}</div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${isPro ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
            {isPro ? 'Active' : 'Free tier'}
          </span>
        </div>

        {isPro ? (
          <div className="text-sm text-zinc-500 space-y-1.5">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Unlimited monitors
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Scans every 10 minutes
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Instant email alerts
            </div>
            {sub?.current_period_end && (
              <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-400">
                Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 space-y-1.5">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              1 active monitor
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Daily scans
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              <span className="text-zinc-400">No email alerts</span>
            </div>
          </div>
        )}
      </div>

      {isPro ? (
        <BillingActions isPro={isPro} />
      ) : (
        <div className="bg-zinc-900 rounded-lg p-5 text-white">
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">Upgrade to Pro</div>
          <div className="text-2xl font-semibold mb-1">$9.99<span className="text-sm font-normal text-zinc-400">/mo</span></div>
          <p className="text-sm text-zinc-400 mb-4">Unlimited monitors, 10-min scans, instant alerts.</p>
          <BillingActions isPro={false} showUpgrade />
        </div>
      )}
    </div>
  )
}
