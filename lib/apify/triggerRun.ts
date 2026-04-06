import { Monitor } from '@/types/database'

/**
 * Triggers a monitor scan using our custom scraper.
 * Replaces the old Apify actor ($25/mo + $29/mo platform fee).
 * Awaits the scraper so it completes before the calling function returns.
 */
export async function triggerMonitorRun(monitor: Monitor, _scanWindowMinutes?: number, runId?: string): Promise<string> {
  const scraperUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/scraper/run?secret=${process.env.SCRAPER_WEBHOOK_SECRET}`

  const res = await fetch(scraperUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monitorId: monitor.id, runId: runId ?? '' }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)')
    throw new Error(`Scraper returned ${res.status}: ${text}`)
  }

  return 'local-scraper'
}
