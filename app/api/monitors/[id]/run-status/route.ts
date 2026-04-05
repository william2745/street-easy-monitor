import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify monitor belongs to user
  const { data: monitor } = await supabase
    .from('monitors')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: run } = await supabase
    .from('scraper_runs')
    .select('status, started_at, finished_at, new_matches, listings_found')
    .eq('monitor_id', id)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(run ?? { status: 'none' })
}
