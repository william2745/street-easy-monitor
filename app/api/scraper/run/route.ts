import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runScraper } from '@/lib/scraper/runScraper'
import { Monitor } from '@/types/database'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.SCRAPER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { monitorId, runId } = await req.json()
  if (!monitorId || !runId) {
    return NextResponse.json({ error: 'Missing monitorId or runId' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', monitorId)
    .single()

  if (!monitor) {
    await supabase.from('scraper_runs').update({ status: 'failed', finished_at: new Date().toISOString() }).eq('id', runId)
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
  }

  try {
    const { newMatches } = await runScraper(monitor as Monitor, runId)
    return NextResponse.json({ ok: true, newMatches })
  } catch (e: unknown) {
    console.error('[scraper] Error:', e)
    await supabase.from('scraper_runs').update({
      status: 'failed', finished_at: new Date().toISOString(),
    }).eq('id', runId)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
