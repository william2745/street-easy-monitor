import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user owns this monitor
  const { data: monitor } = await supabase
    .from('monitors')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get latest run
  const serviceSupabase = createServiceClient()
  const { data: run } = await serviceSupabase
    .from('scraper_runs')
    .select('id, status, started_at, finished_at, new_matches, listings_found')
    .eq('monitor_id', id)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!run) return NextResponse.json({ status: 'none' })

  // Auto-expire runs stuck in 'running' for more than 3 minutes — these are
  // orphaned records from crashed/timed-out function invocations.
  if (run.status === 'running' && run.started_at) {
    const ageMs = Date.now() - new Date(run.started_at).getTime()
    if (ageMs > 3 * 60 * 1000) {
      await serviceSupabase
        .from('scraper_runs')
        .update({ status: 'failed', finished_at: new Date().toISOString() })
        .eq('id', run.id)
      return NextResponse.json({ ...run, status: 'failed' })
    }
  }

  return NextResponse.json(run)
}
