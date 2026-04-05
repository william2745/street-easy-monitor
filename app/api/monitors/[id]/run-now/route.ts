import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { triggerMonitorRun } from '@/lib/apify/triggerRun'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const serviceSupabase = await createServiceClient()
  const { data: runRecord } = await serviceSupabase
    .from('scraper_runs')
    .insert({ monitor_id: id, status: 'running' })
    .select()
    .single()

  try {
    const apifyRunId = await triggerMonitorRun(monitor)
    await serviceSupabase
      .from('scraper_runs')
      .update({ apify_run_id: apifyRunId })
      .eq('id', runRecord?.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    await serviceSupabase
      .from('scraper_runs')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('id', runRecord?.id)
    return NextResponse.json({ error: 'Scraper trigger failed' }, { status: 500 })
  }
}
