import { createClient } from '@/lib/supabase/server'
import BillingActions from './BillingActions'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).eq('status', 'active').single()
  const isPro = sub?.plan === 'pro'

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl text-warm-900 mb-8">Billing</h1>

      <div className="bg-warm-50 rounded-xl p-6 border border-warm-400 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">Current Plan</div>
            <div className="font-serif text-2xl text-warm-900">{isPro ? 'Pro' : 'Free'}</div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${isPro ? 'bg-brand-light text-brand-dark border border-brand-medium' : 'bg-warm-200 text-warm-700'}`}>
            {isPro ? 'Active' : 'Free tier'}
          </span>
        </div>

        <div className="text-sm text-warm-700 space-y-2">
          {isPro ? (
            <>
              {['Unlimited monitors', 'Scans every 10 minutes', 'Instant email alerts'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
              {sub?.current_period_end && (
                <div className="pt-3 mt-3 border-t border-warm-400 text-xs text-warm-600">
                  Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </>
          ) : (
            <>
              {['1 active monitor', 'Daily scans', 'Email alerts'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {isPro ? (
        <BillingActions isPro={isPro} />
      ) : (
        <div className="bg-warm-900 rounded-xl p-6">
          <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Upgrade to Pro</div>
          <div className="font-serif text-3xl text-white mb-1">$9.99<span className="text-base font-sans text-warm-600">/mo</span></div>
          <p className="text-sm text-warm-600 mb-5">Unlimited monitors, 10-min scans, instant alerts.</p>
          <BillingActions isPro={false} showUpgrade />
        </div>
      )}
    </div>
  )
}
