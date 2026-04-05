import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: monitor } = await supabase
    .from('monitors')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: run } = await supabase
    .from('scraper_runs')
    .select('id, status, apify_run_id, started_at, finished_at, new_matches, listings_found')
    .eq('monitor_id', id)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!run) return NextResponse.json({ status: 'none' })

  // If still marked running, verify against Apify and auto-resolve stale runs
  if (run.status === 'running' && run.apify_run_id) {
    try {
      const apifyRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${run.apify_run_id}?token=${process.env.APIFY_API_TOKEN}`
      )
      if (apifyRes.ok) {
        const apifyData = await apifyRes.json()
        const apifyStatus: string = apifyData.data?.status ?? ''

        if (apifyStatus === 'SUCCEEDED' || apifyStatus === 'FAILED') {
          const newStatus = apifyStatus === 'SUCCEEDED' ? 'succeeded' : 'failed'
          const defaultDatasetId: string = apifyData.data?.defaultDatasetId ?? ''

          // Fetch dataset items if succeeded
          let newMatches = 0
          if (newStatus === 'succeeded' && defaultDatasetId) {
            // Trigger webhook processing inline
            const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/scraper?secret=${process.env.SCRAPER_WEBHOOK_SECRET}&monitorId=${id}&userId=${user.id}`
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'ACTOR.RUN.SUCCEEDED',
                resource: {
                  id: run.apify_run_id,
                  defaultDatasetId,
                  status: 'SUCCEEDED',
                },
              }),
            }).catch(() => null)
          }

          const serviceSupabase = await createServiceClient()
          await serviceSupabase
            .from('scraper_runs')
            .update({ status: newStatus, finished_at: new Date().toISOString() })
            .eq('id', run.id)

          return NextResponse.json({ ...run, status: newStatus, new_matches: newMatches })
        }
      }
    } catch {
      // Apify check failed — return DB status as-is
    }
  }

  return NextResponse.json(run)
}
