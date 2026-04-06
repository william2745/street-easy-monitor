import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { triggerMonitorRun } from '@/lib/apify/triggerRun'

export const maxDuration = 55 // wait for scraper to complete

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

  const serviceSupabase = createServiceClient()
  const { data: runRecord } = await serviceSupabase
    .from('scraper_runs')
    .insert({ monitor_id: id, status: 'running' })
    .select()
    .single()

  try {
    await triggerMonitorRun(monitor, undefined, runRecord?.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[run-now] trigger failed:', message)
    await serviceSupabase
      .from('scraper_runs')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('id', runRecord?.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
