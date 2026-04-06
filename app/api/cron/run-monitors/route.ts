import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { triggerMonitorRun } from '@/lib/apify/triggerRun'

export const maxDuration = 55

// Called by Vercel Cron every 15 minutes
export async function GET(req: NextRequest) {
  // Verify it's coming from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  const { data: monitors, error } = await supabase
    .from('monitors')
    .select('*, subscriptions(plan, status)')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const triggered: string[] = []
  const skipped: string[] = []
  const toRun: typeof monitors = []

  for (const monitor of monitors ?? []) {
    const sub = Array.isArray(monitor.subscriptions)
      ? monitor.subscriptions[0]
      : monitor.subscriptions
    const isPro = sub?.plan === 'pro' && sub?.status === 'active'

    // Free tier: max once per 24 hours
    if (!isPro && monitor.last_run_at) {
      const hoursSince = (now.getTime() - new Date(monitor.last_run_at).getTime()) / 3600000
      if (hoursSince < 24) {
        skipped.push(monitor.id)
        continue
      }
    }

    toRun.push(monitor)
  }

  // Run all eligible monitors in parallel
  await Promise.allSettled(
    toRun.map(async (monitor) => {
      try {
        const { data: runRecord } = await supabase
          .from('scraper_runs')
          .insert({ monitor_id: monitor.id, status: 'running' })
          .select()
          .single()

        await triggerMonitorRun(monitor, undefined, runRecord?.id)
        triggered.push(monitor.id)
      } catch (e) {
        console.error(`Failed to trigger monitor ${monitor.id}:`, e)
      }
    })
  )

  return NextResponse.json({ triggered: triggered.length, skipped: skipped.length })
}
