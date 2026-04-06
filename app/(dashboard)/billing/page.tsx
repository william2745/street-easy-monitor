import { createClient } from '@/lib/supabase/server'
import BillingActions from './BillingActions'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).eq('status', 'active').single()
  const isPro = sub?.plan === 'pro'

  return (
    <div className="max-w-md">
      <h1 className="text-[15px] font-semibold text-zinc-900 mb-5">Billing</h1>

      <div className="border border-zinc-200 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Plan</div>
            <div className="text-[15px] font-semibold text-zinc-900 mt-0.5">{isPro ? 'Pro' : 'Free'}</div>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isPro ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-zinc-100 text-zinc-500'}`}>
            {isPro ? 'Active' : 'Free tier'}
          </span>
        </div>
        <div className="text-[13px] text-zinc-500 space-y-1">
          {isPro ? (
            <>
              <div>Unlimited monitors</div>
              <div>Scans every 10 min</div>
              <div>Instant email alerts</div>
              {sub?.current_period_end && (
                <div className="pt-2 mt-2 border-t border-zinc-100 text-[12px] text-zinc-400">
                  Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </>
          ) : (
            <>
              <div>1 active monitor</div>
              <div>Daily scans</div>
              <div className="text-zinc-400">Email alerts included</div>
            </>
          )}
        </div>
      </div>

      {isPro ? (
        <BillingActions isPro={isPro} />
      ) : (
        <div className="bg-zinc-900 rounded-lg p-5">
          <div className="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-1">Upgrade to Pro</div>
          <div className="text-xl font-bold text-white">$9.99<span className="text-[13px] font-normal text-zinc-400">/mo</span></div>
          <p className="text-[13px] text-zinc-400 mt-1 mb-4">Unlimited monitors, 10-min scans, priority alerts.</p>
          <BillingActions isPro={false} showUpgrade />
        </div>
      )}
    </div>
  )
}
