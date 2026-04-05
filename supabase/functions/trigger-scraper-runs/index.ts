/**
 * Supabase Edge Function: trigger-scraper-runs
 *
 * Runs on a pg_cron schedule (*/15 * * * *).
 * Fans out Apify actor runs for all monitors that need a scan.
 *   - Pro users: scan every run (15 min)
 *   - Free users: scan at most once per 24 hours
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_API_BASE = 'https://api.apify.com/v2'
const ACTOR_ID = Deno.env.get('SCRAPER_ACTOR_ID') ?? 'memo23~apify-streeteasy-cheerio'
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? ''
const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN') ?? ''
const WEBHOOK_SECRET = Deno.env.get('SCRAPER_WEBHOOK_SECRET') ?? ''

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get all active monitors with their owner's subscription plan
  const { data: monitors, error } = await supabase
    .from('monitors')
    .select(`
      id,
      user_id,
      name,
      neighborhoods,
      bedrooms,
      min_price,
      max_price,
      no_fee,
      pet_friendly,
      laundry_in_unit,
      laundry_in_building,
      last_run_at,
      subscriptions!inner(plan, status)
    `)
    .eq('is_active', true)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const now = new Date()
  const triggered: string[] = []
  const skipped: string[] = []

  for (const monitor of monitors ?? []) {
    const sub = Array.isArray(monitor.subscriptions)
      ? monitor.subscriptions[0]
      : monitor.subscriptions
    const isPro = sub?.plan === 'pro' && sub?.status === 'active'

    // Free tier: skip if scanned within 24 hours
    if (!isPro && monitor.last_run_at) {
      const lastRun = new Date(monitor.last_run_at)
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / 1000 / 3600
      if (hoursSinceLastRun < 24) {
        skipped.push(monitor.id)
        continue
      }
    }

    // Build StreetEasy search URL
    const searchUrl = buildSearchUrl(monitor)
    const webhookUrl = `${APP_URL}/api/webhooks/scraper?secret=${WEBHOOK_SECRET}`

    try {
      // Create scraper_runs record first
      const { data: runRecord } = await supabase
        .from('scraper_runs')
        .insert({ monitor_id: monitor.id, status: 'running' })
        .select()
        .single()

      // Trigger Apify actor
      const res = await fetch(
        `${APIFY_API_BASE}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startUrls: [{ url: searchUrl }],
            maxItems: 100,
            monitorId: monitor.id,
            userId: monitor.user_id,
            scraperRunId: runRecord?.id,
            webhooks: [
              {
                eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
                requestUrl: webhookUrl,
              },
            ],
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        await supabase
          .from('scraper_runs')
          .update({ apify_run_id: data.data?.id })
          .eq('id', runRecord?.id)
        triggered.push(monitor.id)
      } else {
        await supabase
          .from('scraper_runs')
          .update({ status: 'failed', finished_at: now.toISOString() })
          .eq('id', runRecord?.id)
      }
    } catch (e) {
      console.error(`Failed to trigger monitor ${monitor.id}:`, e)
    }
  }

  return new Response(
    JSON.stringify({ triggered: triggered.length, skipped: skipped.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

function buildSearchUrl(monitor: {
  neighborhoods: string[]
  bedrooms: number[] | null
  min_price: number | null
  max_price: number
  no_fee: boolean
  pet_friendly: boolean
  laundry_in_unit: boolean
  laundry_in_building: boolean
}): string {
  const neighborhoodSlug = monitor.neighborhoods.join(',')
  const params = new URLSearchParams()

  if (monitor.min_price && monitor.max_price) {
    params.set('price', `${monitor.min_price}-${monitor.max_price}`)
  } else if (monitor.max_price) {
    params.set('price', `-${monitor.max_price}`)
  }

  if (monitor.bedrooms && monitor.bedrooms.length > 0) {
    params.set('beds', monitor.bedrooms.join(','))
  }

  if (monitor.no_fee) params.set('no_fee', '1')
  if (monitor.pet_friendly) params.set('pet_policy', 'allowed')
  if (monitor.laundry_in_unit) params.set('laundry', 'in_unit')
  else if (monitor.laundry_in_building) params.set('laundry', 'in_building')

  params.set('sort_by', 'listed_desc')

  const query = params.toString()
  return `https://streeteasy.com/for-rent/${neighborhoodSlug}${query ? '?' + query : ''}`
}
