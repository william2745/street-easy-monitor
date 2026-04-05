import { Monitor } from '@/types/database'
import { buildSearchUrl } from './buildSearchUrl'

const APIFY_API_BASE = 'https://api.apify.com/v2'
// Use Apify's free Playwright Scraper — renders JavaScript so StreetEasy's
// client-side listing results are visible. No rental required.
const ACTOR_ID = 'apify~playwright-scraper'

// Page function for Apify Playwright Scraper.
// StreetEasy loads listings via XHR after initial page load — we intercept those
// API responses directly instead of parsing the DOM.
const STREETEASY_PAGE_FUNCTION = /* js */ `
async function pageFunction(context) {
  const { page, log } = context;
  const capturedListings = [];

  function extractFromJson(json) {
    var raw = json.listings || json.results || json.rentals || json.items || [];
    if (!Array.isArray(raw) || raw.length === 0) return;
    raw.forEach(function(l) {
      var id = l.id || l.listingId || l.listing_id;
      if (!id) return;
      capturedListings.push({
        listingId: String(id),
        url: l.url || ('https://streeteasy.com/rental/' + id),
        address: l.full_address || l.address || l.streetAddress || null,
        neighborhood: l.areaName || l.neighborhood || null,
        bedrooms: l.bedrooms != null ? l.bedrooms : (l.beds != null ? l.beds : null),
        price: l.price || l.listingPrice || l.rent || null,
        noFee: !!(l.noFee || l.no_fee),
        petFriendly: !!(l.petFriendly || l.pets_allowed || l.petsAllowed),
        hasLaundry: !!(l.hasLaundry || l.laundry_in_unit || l.laundry_in_building),
      });
    });
  }

  // Intercept XHR/fetch responses that contain listing data
  await page.route('**', async function(route) {
    var response;
    try {
      response = await route.fetch();
    } catch(e) {
      await route.abort();
      return;
    }
    // Check JSON responses for listing arrays
    try {
      var ct = response.headers()['content-type'] || '';
      if (ct.includes('json')) {
        var text = await response.text();
        var json = JSON.parse(text);
        extractFromJson(json);
        // Also check nested: { data: { listings: [...] } }
        if (json.data) extractFromJson(json.data);
      }
    } catch(e) {}
    await route.fulfill({ response: response });
  });

  // Wait for network to go idle — all XHR listing calls should complete
  await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(function() {
    log.warning('networkidle timeout — using captured so far');
  });

  // If XHR interception found nothing, fall back to __NEXT_DATA__
  if (capturedListings.length === 0) {
    var fromNextData = await page.evaluate(function() {
      var results = [];
      var el = document.getElementById('__NEXT_DATA__');
      if (!el) return results;
      try {
        var data = JSON.parse(el.textContent);
        var pp = data && data.props && data.props.pageProps;
        var raw = (pp && pp.listings) || (pp && pp.searchListings) || [];
        raw.forEach(function(l) {
          var id = l.id || l.listingId;
          if (!id) return;
          results.push({
            listingId: String(id),
            url: l.url || ('https://streeteasy.com/rental/' + id),
            address: l.full_address || l.address || null,
            neighborhood: l.areaName || l.neighborhood || null,
            bedrooms: l.bedrooms != null ? l.bedrooms : null,
            price: l.price || null,
            noFee: !!(l.noFee || l.no_fee),
            petFriendly: !!(l.petFriendly || l.pets_allowed),
            hasLaundry: !!(l.hasLaundry),
          });
        });
      } catch(e) {}
      return results;
    });
    fromNextData.forEach(function(l) { capturedListings.push(l); });
  }

  log.info('Captured ' + capturedListings.length + ' listings via XHR/Next.js');
  return capturedListings;
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
