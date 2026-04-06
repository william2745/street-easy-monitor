import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendListingAlert } from '@/lib/resend/sendAlert'
import { getUserPlan } from '@/lib/monitors/checkTierLimit'
import { ListingMatch } from '@/types/database'

type ApifyListing = {
  // memo23 actor uses node_ prefixed GraphQL-flattened fields
  node_id?: string
  node_urlPath?: string
  node_price?: number
  node_bedroomCount?: number
  node_areaName?: string
  node_street?: string
  node_unit?: string
  node_noFee?: boolean
  node_status?: string
  node_leadMedia_photo_key?: string
  node_availableAt?: string
  // fallback legacy field names
  id?: string
  listingId?: string
  url?: string
  price?: number
  bedrooms?: number
  address?: string
  neighborhood?: string
  noFee?: boolean
}

async function fetchDatasetItems(datasetId: string): Promise<ApifyListing[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_TOKEN}&format=json&clean=true`
  )
  if (!res.ok) return []
  const items = await res.json()
  return Array.isArray(items) ? items : []
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.SCRAPER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await req.json()

  // monitorId/userId are passed as query params on the webhook URL
  const monitorId: string = searchParams.get('monitorId') ?? payload.resource?.input?.monitorId ?? payload.monitorId
  const userId: string = searchParams.get('userId') ?? payload.resource?.input?.userId ?? payload.userId
  const apifyRunId: string = payload.resource?.id ?? payload.runId ?? ''
  const eventType: string = payload.eventType ?? ''
  const defaultDatasetId: string = payload.resource?.defaultDatasetId ?? ''

  // Fetch listings from Apify dataset (cheerio-scraper stores results there)
  const listings: ApifyListing[] = defaultDatasetId
    ? await fetchDatasetItems(defaultDatasetId)
    : (payload.resource?.items ?? payload.items ?? [])

  if (!monitorId) {
    return NextResponse.json({ error: 'Missing monitorId' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Update scraper run record
  if (eventType === 'ACTOR.RUN.FAILED') {
    await supabase
      .from('scraper_runs')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('apify_run_id', apifyRunId)
    return NextResponse.json({ ok: true })
  }

  function seImageUrl(key: string | undefined): string | null {
    if (!key) return null
    return `https://media.streeteasy.com/6/${key}-ci/0/1/fill/400/300/center/1`
  }

  // Normalize memo23 actor's node_-prefixed GraphQL fields + legacy fallbacks
  const normalized = listings.map(l => {
    const urlPath = l.node_urlPath
    const url = urlPath ? `https://streeteasy.com${urlPath}` : (l.url ?? '')
    const street = l.node_street
    const unit = l.node_unit
    const builtAddress = [street, unit ? `#${unit}` : ''].filter(Boolean).join(' ') || undefined
    const address = l.address ?? builtAddress
    return {
      ...l,
      resolvedId: l.node_id ?? l.listingId ?? l.id ?? extractListingId(url),
      url,
      price: l.node_price ?? l.price,
      bedrooms: l.node_bedroomCount ?? l.bedrooms,
      neighborhood: l.node_areaName ?? l.neighborhood,
      address,
      noFee: l.node_noFee ?? l.noFee,
      title: address,
      status: l.node_status,
      imageUrl: seImageUrl(l.node_leadMedia_photo_key),
      listedAt: l.node_availableAt ?? null,
    }
  }).filter(l => l.resolvedId && l.status !== 'INACTIVE')

  if (normalized.length === 0) {
    await supabase
      .from('scraper_runs')
      .update({ status: 'succeeded', listings_found: 0, new_matches: 0, finished_at: new Date().toISOString() })
      .eq('apify_run_id', apifyRunId)
    return NextResponse.json({ ok: true })
  }

  // Bulk deduplication check
  const ids = normalized.map(l => l.resolvedId!)
  const { data: alreadySeen } = await supabase
    .from('seen_listings')
    .select('listing_id')
    .eq('monitor_id', monitorId)
    .in('listing_id', ids)

  const seenSet = new Set((alreadySeen ?? []).map(r => r.listing_id))
  const newListings = normalized.filter(l => !seenSet.has(l.resolvedId!))

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
    pet_friendly: null,
    has_laundry: null,
    image_url: l.imageUrl ?? null,
    listing_url: l.url,
    listed_at: l.listedAt,
  }))

  const { data: insertedMatches } = await supabase
    .from('listing_matches')
    .insert(matchRows)
    .select()

  // Send email alert to all users
  if (insertedMatches && insertedMatches.length > 0) {
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
  // Matches numeric IDs (/rental/12345678) and alphanumeric StreetEasy IDs
  const match = url.match(/\/rental\/([A-Z0-9]{6,})\/?/i) || url.match(/\/(\d{6,})\/?/)
  return match ? match[1] : null
}
