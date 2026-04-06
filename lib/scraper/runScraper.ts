import { createServiceClient } from '@/lib/supabase/server'
import { buildSearchUrl } from '@/lib/apify/buildSearchUrl'
import { fetchListings } from '@/lib/scraper/fetchListings'
import { sendListingAlert } from '@/lib/resend/sendAlert'
import { ListingMatch, Monitor } from '@/types/database'

/**
 * Core scraper logic — shared by the /api/scraper/run HTTP endpoint
 * and triggerMonitorRun (called directly to avoid a second HTTP hop).
 */
export async function runScraper(monitor: Monitor, runId: string): Promise<{ newMatches: number; listingsFound: number }> {
  const supabase = createServiceClient()
  const monitorId = monitor.id

  const searchUrl = buildSearchUrl(monitor)
  console.log(`[scraper] Fetching: ${searchUrl}`)

  const listings = await fetchListings(searchUrl)
  console.log(`[scraper] Found ${listings.length} listings`)

  if (listings.length === 0) {
    await supabase.from('monitors').update({ last_run_at: new Date().toISOString() }).eq('id', monitorId)
    await supabase.from('scraper_runs').update({
      status: 'succeeded', listings_found: 0, new_matches: 0, finished_at: new Date().toISOString(),
    }).eq('id', runId)
    return { newMatches: 0, listingsFound: 0 }
  }

  // Normalize to a consistent shape
  const normalized = listings.map(l => ({
    resolvedId: l.id,
    url: `https://streeteasy.com${l.urlPath}`,
    price: l.price,
    bedrooms: l.bedroomCount,
    neighborhood: l.areaName,
    address: [l.street, l.unit].filter(Boolean).join(' ') || null,
    noFee: l.noFee,
    title: [l.street, l.unit].filter(Boolean).join(' ') || null,
    imageUrl: l.photoKey ? `https://media.streeteasy.com/6/${l.photoKey}-ci/0/1/fill/400/300/center/1` : null,
    listedAt: l.availableAt,
  }))

  // Dedup against seen_listings
  const ids = normalized.map(l => l.resolvedId)
  const { data: alreadySeen } = await supabase
    .from('seen_listings')
    .select('listing_id')
    .eq('monitor_id', monitorId)
    .in('listing_id', ids)

  const seenSet = new Set((alreadySeen ?? []).map(r => r.listing_id))
  const newListings = normalized.filter(l => !seenSet.has(l.resolvedId))

  if (newListings.length === 0) {
    await supabase.from('monitors').update({ last_run_at: new Date().toISOString() }).eq('id', monitorId)
    await supabase.from('scraper_runs').update({
      status: 'succeeded', listings_found: listings.length, new_matches: 0, finished_at: new Date().toISOString(),
    }).eq('id', runId)
    return { newMatches: 0, listingsFound: listings.length }
  }

  // Mark new listings as seen
  await supabase.from('seen_listings').upsert(
    newListings.map(l => ({ monitor_id: monitorId, listing_id: l.resolvedId })),
    { onConflict: 'monitor_id,listing_id' }
  )

  // Insert match records
  const matchRows = newListings.map(l => ({
    monitor_id: monitorId,
    user_id: monitor.user_id,
    listing_id: l.resolvedId,
    title: l.title,
    address: l.address,
    neighborhood: l.neighborhood,
    bedrooms: l.bedrooms,
    price: l.price,
    no_fee: l.noFee,
    pet_friendly: null,
    has_laundry: null,
    image_url: l.imageUrl,
    listing_url: l.url,
    listed_at: l.listedAt,
  }))

  const { data: insertedMatches } = await supabase
    .from('listing_matches')
    .insert(matchRows)
    .select()

  // Send alerts
  if (insertedMatches && insertedMatches.length > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone_number')
      .eq('id', monitor.user_id)
      .single()

    if (profile?.email) {
      await sendListingAlert(profile.email, monitor.name, insertedMatches as ListingMatch[])

      if (profile.phone_number && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const count = insertedMatches.length
        const first = insertedMatches[0] as ListingMatch
        const body = count === 1
          ? `StreetSnipe: New match on ${monitor.name}! ${first.address ?? first.neighborhood ?? 'NYC listing'} — $${first.price?.toLocaleString()}/mo ${first.listing_url}`
          : `StreetSnipe: ${count} new matches on ${monitor.name}! View at streetsnipe.com/monitors/${monitorId}`
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: process.env.TWILIO_FROM_NUMBER!, To: profile.phone_number, Body: body }).toString(),
        }).catch(() => {})
      }

      await supabase.from('listing_matches')
        .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
        .in('id', insertedMatches.map(m => m.id))
    }
  }

  // Update monitor and run record
  await supabase.from('monitors').update({ last_run_at: new Date().toISOString() }).eq('id', monitorId)
  await supabase.from('scraper_runs').update({
    status: 'succeeded',
    listings_found: listings.length,
    new_matches: newListings.length,
    finished_at: new Date().toISOString(),
  }).eq('id', runId)

  return { newMatches: newListings.length, listingsFound: listings.length }
}
