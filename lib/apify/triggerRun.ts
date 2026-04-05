import { Monitor } from '@/types/database'
import { buildSearchUrl } from './buildSearchUrl'

const APIFY_API_BASE = 'https://api.apify.com/v2'
// Use Apify's free Playwright Scraper — renders JavaScript so StreetEasy's
// client-side listing results are visible. No rental required.
const ACTOR_ID = 'apify~playwright-scraper'

// Page function for Apify Playwright Scraper.
// Waits for StreetEasy listings to render, then extracts from DOM + __NEXT_DATA__.
const STREETEASY_PAGE_FUNCTION = /* js */ `
async function pageFunction(context) {
  const { page, log, request } = context;

  // Wait for listing cards to appear (StreetEasy renders them client-side)
  try {
    await page.waitForSelector(
      '[data-id], [data-listing-id], [class*="listingCard"], [class*="SearchResultCard"], li[class*="listing"]',
      { timeout: 20000 }
    );
  } catch(e) {
    log.warning('Listing selector timed out, trying __NEXT_DATA__ anyway');
  }

  const results = await page.evaluate(function() {
    var listings = [];

    // 1. Try __NEXT_DATA__ (Next.js SSR/hydration data)
    var el = document.getElementById('__NEXT_DATA__');
    if (el) {
      try {
        var data = JSON.parse(el.textContent);
        var pp = data && data.props && data.props.pageProps;
        var raw =
          (pp && pp.listings) ||
          (pp && pp.search && pp.search.listings) ||
          (pp && pp.results) ||
          (pp && pp.initialListings) ||
          [];
        // Also try dehydrated react-query state
        if (raw.length === 0 && pp && pp.dehydratedState) {
          var queries = pp.dehydratedState.queries || [];
          for (var qi = 0; qi < queries.length; qi++) {
            var pages = (queries[qi].state && queries[qi].state.data && queries[qi].state.data.pages) || [];
            for (var pi = 0; pi < pages.length; pi++) {
              var items = pages[pi].listings || pages[pi].results || pages[pi].items || [];
              raw = raw.concat(items);
            }
          }
        }
        for (var i = 0; i < raw.length; i++) {
          var l = raw[i];
          var id = l.id || l.listingId || l.listing_id;
          if (!id) continue;
          listings.push({
            listingId: String(id),
            url: l.url || ('https://streeteasy.com/rental/' + id),
            address: l.full_address || l.address || l.streetAddress || null,
            neighborhood: l.areaName || l.neighborhood || null,
            bedrooms: l.bedrooms != null ? l.bedrooms : (l.beds != null ? l.beds : null),
            price: l.price || l.listingPrice || null,
            noFee: !!(l.noFee || l.no_fee),
            petFriendly: !!(l.petFriendly || l.pets_allowed),
            hasLaundry: !!(l.hasLaundry || l.laundry_in_unit || l.laundry_in_building),
          });
        }
      } catch(e) {}
    }

    // 2. DOM fallback — rendered listing cards
    if (listings.length === 0) {
      var cards = document.querySelectorAll('[data-id], [data-listing-id], article[class*="listing"]');
      cards.forEach(function(card) {
        var lid = card.getAttribute('data-id') || card.getAttribute('data-listing-id');
        var anchor = card.querySelector('a[href*="/rental/"], a[href*="/building/"]');
        var href = anchor && anchor.getAttribute('href');
        if (!href && !lid) return;
        var url = href
          ? (href.indexOf('http') === 0 ? href : 'https://streeteasy.com' + href)
          : ('https://streeteasy.com/rental/' + lid);
        var priceEl = card.querySelector('[class*="price"]');
        var price = priceEl ? parseInt(priceEl.textContent.replace(/\\D/g,''), 10) || null : null;
        var addrEl = card.querySelector('[class*="address"]');
        listings.push({
          listingId: lid || null,
          url: url,
          address: addrEl ? addrEl.textContent.trim() : null,
          price: price,
        });
      });
    }

    return listings;
  });

  log.info('Found ' + results.length + ' listings on ' + request.url);
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
