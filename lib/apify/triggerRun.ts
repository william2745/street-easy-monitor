import { Monitor } from '@/types/database'
import { buildSearchUrl } from './buildSearchUrl'

const APIFY_API_BASE = 'https://api.apify.com/v2'
// Use Apify's own free Cheerio Scraper — no rental required, uses compute credits
const ACTOR_ID = 'apify~cheerio-scraper'

// Page function injected into Apify's Cheerio Scraper to parse StreetEasy listings.
// StreetEasy is a Next.js app — listing data is embedded in __NEXT_DATA__ JSON.
const STREETEASY_PAGE_FUNCTION = /* js */ `
async function pageFunction(context) {
  const { $ } = context;
  const results = [];

  // Primary: parse __NEXT_DATA__ (Next.js server-side JSON)
  const nextDataText = $('script#__NEXT_DATA__').text();
  if (nextDataText) {
    try {
      const data = JSON.parse(nextDataText);
      const pp = data && data.props && data.props.pageProps;
      const rawListings =
        (pp && pp.listings) ||
        (pp && pp.search && pp.search.listings) ||
        (pp && pp.results) ||
        (pp && pp.dehydratedState && pp.dehydratedState.queries
          ? pp.dehydratedState.queries
              .flatMap(function(q) { return (q && q.state && q.state.data && q.state.data.pages) || []; })
              .flatMap(function(p) { return p.listings || p.results || []; })
          : []);

      if (rawListings && rawListings.length > 0) {
        for (var i = 0; i < rawListings.length; i++) {
          var l = rawListings[i];
          var id = l.id || l.listingId || l.listing_id;
          if (!id) continue;
          results.push({
            listingId: String(id),
            url: l.url || ('https://streeteasy.com/rental/' + id),
            address: l.full_address || l.address || l.streetAddress || null,
            neighborhood: l.areaName || l.neighborhood || null,
            bedrooms: l.bedrooms != null ? l.bedrooms : (l.beds != null ? l.beds : null),
            price: l.price || l.listingPrice || null,
            noFee: !!(l.noFee || l.no_fee),
            petFriendly: !!(l.petFriendly || l.pets_allowed),
            hasLaundry: !!(l.hasLaundry || l.laundry_in_unit || l.laundry_in_building),
            imageUrl: null,
          });
        }
      }
    } catch(e) {
      context.log.warning('__NEXT_DATA__ parse failed: ' + e.message);
    }
  }

  // Fallback: parse listing cards from DOM
  if (results.length === 0) {
    $('article[data-id], [data-listing-id], .listingCard').each(function(_, el) {
      var $el = $(el);
      var listingId = $el.attr('data-id') || $el.attr('data-listing-id');
      var link = $el.find('a[href*="/rental/"], a[href*="/building/"]').first().attr('href');
      if (!link && !listingId) return;
      var url = link
        ? (link.indexOf('http') === 0 ? link : 'https://streeteasy.com' + link)
        : ('https://streeteasy.com/rental/' + listingId);
      var priceText = $el.find('[class*="price"]').first().text();
      var price = parseInt(priceText.replace(/\\D/g, ''), 10) || null;
      results.push({
        listingId: listingId || null,
        url: url,
        address: $el.find('[class*="address"]').first().text().trim() || null,
        price: price,
      });
    });
  }

  context.log.info('Found ' + results.length + ' listings on ' + context.request.url);
  return results;
}
`

export async function triggerMonitorRun(monitor: Monitor, scanWindowMinutes?: number): Promise<string> {
  const searchUrl = buildSearchUrl(monitor, scanWindowMinutes ?? monitor.scan_interval)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/scraper?secret=${process.env.SCRAPER_WEBHOOK_SECRET}&monitorId=${monitor.id}&userId=${monitor.user_id}`

  const response = await fetch(
    `${APIFY_API_BASE}/acts/${ACTOR_ID}/runs?token=${process.env.APIFY_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: searchUrl }],
        pageFunction: STREETEASY_PAGE_FUNCTION,
        proxyConfiguration: { useApifyProxy: true },
        maxRequestsPerCrawl: 1,
        maxConcurrency: 1,
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
            requestUrl: webhookUrl,
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Apify trigger failed: ${response.status} ${body}`)
  }

  const data = await response.json()
  return data.data.id as string
}
