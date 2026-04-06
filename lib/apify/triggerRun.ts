import { Monitor } from '@/types/database'
import { runScraper } from '@/lib/scraper/runScraper'

/**
 * Triggers a monitor scan by calling runScraper() directly.
 * No HTTP hop — avoids Vercel function-to-function timeout issues.
 */
export async function triggerMonitorRun(monitor: Monitor, _scanWindowMinutes?: number, runId?: string): Promise<string> {
  if (!runId) throw new Error('[triggerMonitorRun] runId is required')
  await runScraper(monitor, runId)
  return 'local-scraper'
}
