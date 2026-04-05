import { createServiceClient } from '@/lib/supabase/server'

export async function checkMonitorLimit(userId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const supabase = await createServiceClient()

  // Check subscription plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  const plan = sub?.plan ?? 'free'

  if (plan === 'pro') return { allowed: true }

  // Free tier: max 1 monitor
  const { count } = await supabase
    .from('monitors')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  if ((count ?? 0) >= 1) {
    return {
      allowed: false,
      reason: 'Free plan is limited to 1 active monitor. Upgrade to Pro for unlimited monitors.',
    }
  }

  return { allowed: true }
}

export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return (data?.plan as 'free' | 'pro') ?? 'free'
}
