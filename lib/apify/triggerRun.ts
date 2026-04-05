import { Monitor } from '@/types/database'
import { buildSearchUrl } from './buildSearchUrl'

const APIFY_API_BASE = 'https://api.apify.com/v2'
const ACTOR_ID = process.env.SCRAPER_ACTOR_ID ?? 'memo23~apify-streeteasy-cheerio'

export async function triggerMonitorRun(monitor: Monitor, scanWindowMinutes?: number): Promise<string> {
  const searchUrl = buildSearchUrl(monitor, scanWindowMinutes ?? monitor.scan_interval)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/scraper?secret=${process.env.SCRAPER_WEBHOOK_SECRET}`

  const response = await fetch(
    `${APIFY_API_BASE}/acts/${ACTOR_ID}/runs?token=${process.env.APIFY_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: searchUrl }],
        maxItems: 100,
        // Pass monitor context through — Apify forwards this in the webhook payload
        monitorId: monitor.id,
        userId: monitor.user_id,
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
            requestUrl: webhookUrl,
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Apify trigger failed: ${response.status} ${body}`)
  }

  const data = await response.json()
  return data.data.id as string
}
