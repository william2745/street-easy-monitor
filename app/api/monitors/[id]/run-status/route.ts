import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Monitor } from '@/types/database'

// memo23 actor returns GraphQL-flattened fields with node_ prefix
type ActorItem = Record<string, unknown>

function normalizeItem(item: ActorItem) {
  const nodeId = item.node_id as string | undefined
  const urlPath = item.node_urlPath as string | undefined
  const url = urlPath ? `https://streeteasy.com${urlPath}` : ''
  const street = item.node_street as string | undefined
  const unit = item.node_unit as string | undefined
  const address = [street, unit ? `#${unit}` : ''].filter(Boolean).join(' ') || undefined

  return {
    listingId: nodeId,
    url,
    price: item.node_price as number | undefined,
    bedrooms: item.node_bedroomCount as number | undefined,
    neighborhood: item.node_areaName as string | undefined,
    address,
    noFee: item.node_noFee as boolean | undefined,
    status: item.node_status as string | undefined,
    title: address,
    imageKey: item.node_leadMedia_photo_key as string | undefined,
  }
}

function itemMatchesMonitor(item: ReturnType<typeof normalizeItem>, monitor: Monitor): boolean {
  if (item.status !== 'ACTIVE') return false
  if (monitor.max_price && item.price != null && item.price > monitor.max_price) return false
  if (monitor.min_price && item.price != null && item.price < monitor.min_price) return false
  if (monitor.bedrooms && monitor.bedrooms.length > 0 && item.bedrooms != null) {
    if (!monitor.bedrooms.includes(item.bedrooms)) return false
  }
  return true
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: run } = await supabase
    .from('scraper_runs')
    .select('id, status, apify_run_id, started_at, finished_at, new_matches, listings_found')
    .eq('monitor_id', id)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!run) return NextResponse.json({ status: 'none' })

  console.log(`[run-status] monitor=${id} run=${run.id} status=${run.status} apify_run_id=${run.apify_run_id}`)

  if (run.status === 'running') {
    if (!run.apify_run_id) {
      console.log('[run-status] apify_run_id not set yet, waiting...')
      return NextResponse.json(run)
    }

    try {
      const apifyRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${run.apify_run_id}?token=${process.env.APIFY_API_TOKEN}`
      )
      console.log(`[run-status] Apify API status: ${apifyRes.status}`)
      if (!apifyRes.ok) return NextResponse.json(run)

      const apifyData = await apifyRes.json()
      const apifyStatus: string = apifyData.data?.status ?? ''
      const defaultDatasetId: string = apifyData.data?.defaultDatasetId ?? ''
      console.log(`[run-status] Apify run status=${apifyStatus} datasetId=${defaultDatasetId}`)

      const terminal = ['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED']
      if (!terminal.includes(apifyStatus)) {
        // Still running on Apify
        return NextResponse.json(run)
      }

      const newStatus = apifyStatus === 'SUCCEEDED' ? 'succeeded' : 'failed'
      const serviceSupabase = createServiceClient()
      let newMatches = 0

      if (newStatus === 'succeeded' && defaultDatasetId) {
        try {
          const itemsRes = await fetch(
            `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${process.env.APIFY_API_TOKEN}&format=json&clean=true&limit=200`
          )
          const rawItems: ActorItem[] = itemsRes.ok ? await itemsRes.json() : []
          console.log(`[run-status] raw dataset items: ${rawItems.length}`)

          // Normalize and filter to monitor criteria
          const normalized = rawItems.map(normalizeItem)
          const matching = normalized.filter(item => itemMatchesMonitor(item, monitor as Monitor))
          console.log(`[run-status] matching monitor criteria: ${matching.length}`)

          const withIds = matching.filter(item => item.listingId)

          if (withIds.length > 0) {
            const ids = withIds.map(l => l.listingId!)
            const { data: alreadySeen } = await serviceSupabase
              .from('seen_listings')
              .select('listing_id')
              .eq('monitor_id', id)
              .in('listing_id', ids)

            const seenSet = new Set((alreadySeen ?? []).map(r => r.listing_id))
            const newListings = withIds.filter(l => !seenSet.has(l.listingId!))
            newMatches = newListings.length
            console.log(`[run-status] new listings (unseen): ${newMatches}`)

            if (newListings.length > 0) {
              await serviceSupabase.from('seen_listings').upsert(
                newListings.map(l => ({ monitor_id: id, listing_id: l.listingId! })),
                { onConflict: 'monitor_id,listing_id' }
              )

              const matchRows = newListings.map(l => ({
                monitor_id: id,
                user_id: user.id,
                listing_id: l.listingId!,
                title: l.title ?? null,
                address: l.address ?? null,
                neighborhood: l.neighborhood ?? null,
                bedrooms: l.bedrooms ?? null,
                price: l.price ?? null,
                no_fee: l.noFee ?? null,
                pet_friendly: null,
                has_laundry: null,
                image_url: null,
                listing_url: l.url,
              }))

              await serviceSupabase.from('listing_matches').insert(matchRows)
            }
          }
        } catch (err) {
          console.error('[run-status] dataset processing error:', err)
        }
      }

      await serviceSupabase
        .from('scraper_runs')
        .update({ status: newStatus, finished_at: new Date().toISOString(), new_matches: newMatches, listings_found: newMatches })
        .eq('id', run.id)

      await serviceSupabase
        .from('monitors')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', id)

      console.log(`[run-status] resolved → ${newStatus}, ${newMatches} new matches`)
      return NextResponse.json({ ...run, status: newStatus, new_matches: newMatches })
    } catch (err) {
      console.error('[run-status] error:', err)
      return NextResponse.json(run)
    }
  }

  return NextResponse.json(run)
}
