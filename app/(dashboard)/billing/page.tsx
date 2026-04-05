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
      <h1 className="font-serif text-3xl text-[#2C2420] mb-8">Billing</h1>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)] mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-[#2C2420]">Current plan</div>
            <div className="text-2xl font-serif text-[#2C2420] mt-1">
              {isPro ? 'Pro' : 'Free'}
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full ${isPro ? 'bg-[#F5E8DC] text-[#C4703A]' : 'bg-[#F0EBE1] text-[#6B5E52]'}`}>
            {isPro ? 'Active' : 'Free tier'}
          </span>
        </div>

        {isPro ? (
          <div className="text-sm text-[#6B5E52] space-y-1">
            <div>Unlimited monitors</div>
            <div>Scans every 15 minutes</div>
            <div>Instant email alerts</div>
            {sub?.current_period_end && (
              <div className="mt-3 pt-3 border-t border-[#E8E0D5] text-xs">
                Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[#6B5E52] space-y-1">
            <div>1 active monitor</div>
            <div>Daily scans</div>
            <div className="text-[#C4703A]">No email alerts</div>
          </div>
        )}
      </div>

      <BillingActions isPro={isPro} />

      {!isPro && (
        <div className="mt-6 bg-[#2C2420] rounded-2xl p-6 text-white">
          <div className="text-sm text-[#C4703A] font-medium mb-2">Upgrade to Pro</div>
          <div className="font-serif text-3xl mb-4">$9.99<span className="text-base font-sans text-[#E8E0D5]">/mo</span></div>
          <ul className="text-sm text-[#E8E0D5] space-y-2 mb-6">
            <li>Unlimited monitors</li>
            <li>Scans every 15 minutes</li>
            <li>Instant email alerts the moment a match appears</li>
          </ul>
          <BillingActions isPro={false} showUpgrade />
        </div>
      )}
    </div>
  )
}
