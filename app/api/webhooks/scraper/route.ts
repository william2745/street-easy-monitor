import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendListingAlert } from '@/lib/resend/sendAlert'
import { getUserPlan } from '@/lib/monitors/checkTierLimit'
import { ListingMatch } from '@/types/database'

type ApifyListing = {
  id?: string
  listingId?: string
  url: string
  address?: string
  neighborhood?: string
  bedrooms?: number
  price?: number
  noFee?: boolean
  petFriendly?: boolean
  hasLaundry?: boolean
  imageUrl?: string
  title?: string
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.SCRAPER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await req.json()

  // Apify webhook payload shape
  const monitorId: string = payload.resource?.input?.monitorId ?? payload.monitorId
  const userId: string = payload.resource?.input?.userId ?? payload.userId
  const listings: ApifyListing[] = payload.resource?.items ?? payload.items ?? []
  const apifyRunId: string = payload.resource?.id ?? payload.runId ?? ''
  const eventType: string = payload.eventType ?? ''

  if (!monitorId) {
    return NextResponse.json({ error: 'Missing monitorId' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Update scraper run record
  if (eventType === 'ACTOR.RUN.FAILED') {
    await supabase
      .from('scraper_runs')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('apify_run_id', apifyRunId)
    return NextResponse.json({ ok: true })
  }

  // Extract listing IDs from URLs (e.g. /rental/12345678 or /building/foo/unit)
  const withIds = listings.map(l => {
    const extractedId = l.listingId ?? l.id ?? extractListingId(l.url)
    return { ...l, resolvedId: extractedId }
  }).filter(l => l.resolvedId)

  if (withIds.length === 0) {
    await supabase
      .from('scraper_runs')
      .update({ status: 'succeeded', listings_found: 0, new_matches: 0, finished_at: new Date().toISOString() })
      .eq('apify_run_id', apifyRunId)
    return NextResponse.json({ ok: true })
  }

  // Bulk deduplication check
  const ids = withIds.map(l => l.resolvedId!)
  const { data: alreadySeen } = await supabase
    .from('seen_listings')
    .select('listing_id')
    .eq('monitor_id', monitorId)
    .in('listing_id', ids)

  const seenSet = new Set((alreadySeen ?? []).map(r => r.listing_id))
  const newListings = withIds.filter(l => !seenSet.has(l.resolvedId!))

  if (newListings.length === 0) {
    await supabase.from('monitors').update({ last_run_at: new Date().toISOString() }).eq('id', monitorId)
    await supabase
      .from('scraper_runs')
      .update({ status: 'succeeded', listings_found: listings.length, new_matches: 0, finished_at: new Date().toISOString() })
      .eq('apify_run_id', apifyRunId)
    return NextResponse.json({ ok: true, newMatches: 0 })
  }

  // Insert into seen_listings (ignore conflicts)
  await supabase.from('seen_listings').upsert(
    newListings.map(l => ({ monitor_id: monitorId, listing_id: l.resolvedId! })),
    { onConflict: 'monitor_id,listing_id' }
  )

  // Insert match records
  const matchRows = newListings.map(l => ({
    monitor_id: monitorId,
    user_id: userId,
    listing_id: l.resolvedId!,
    title: l.title ?? null,
    address: l.address ?? null,
    neighborhood: l.neighborhood ?? null,
    bedrooms: l.bedrooms ?? null,
    price: l.price ?? null,
    no_fee: l.noFee ?? null,
    pet_friendly: l.petFriendly ?? null,
    has_laundry: l.hasLaundry ?? null,
    image_url: l.imageUrl ?? null,
    listing_url: l.url,
  }))

  const { data: insertedMatches } = await supabase
    .from('listing_matches')
    .insert(matchRows)
    .select()

  // Send email alert (pro users only)
  const plan = await getUserPlan(userId)
  if (plan === 'pro' && insertedMatches && insertedMatches.length > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    const { data: monitor } = await supabase
      .from('monitors')
      .select('name')
      .eq('id', monitorId)
      .single()

    if (profile?.email && monitor?.name) {
      await sendListingAlert(profile.email, monitor.name, insertedMatches as ListingMatch[])
      await supabase
        .from('listing_matches')
        .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
        .in('id', insertedMatches.map(m => m.id))
    }
  }

  // Update monitor and scraper run
  await supabase.from('monitors').update({ last_run_at: new Date().toISOString() }).eq('id', monitorId)
  await supabase
    .from('scraper_runs')
    .update({
      status: 'succeeded',
      listings_found: listings.length,
      new_matches: newListings.length,
      finished_at: new Date().toISOString(),
    })
    .eq('apify_run_id', apifyRunId)

  return NextResponse.json({ ok: true, newMatches: newListings.length })
}

function extractListingId(url: string): string | null {
  const match = url.match(/\/(\d{6,})\/?/)
  return match ? match[1] : null
}
