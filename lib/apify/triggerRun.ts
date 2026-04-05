import { Monitor } from '@/types/database'
import { buildSearchUrl } from './buildSearchUrl'

const APIFY_API_BASE = 'https://api.apify.com/v2'
// Use Apify's free Playwright Scraper — renders JavaScript so StreetEasy's
// client-side listing results are visible. No rental required.
const ACTOR_ID = 'apify~playwright-scraper'

// Page function — dumps __NEXT_DATA__ structure so we know where listings live,
// then extracts them. Block images/CSS to load faster.
const STREETEASY_PAGE_FUNCTION = /* js */ `
async function pageFunction(context) {
  const { page, log } = context;

  // Block images, fonts, CSS — cuts load time significantly
  await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf,css}', function(r) {
    r.abort();
  });

  // Wait for content — shorter timeout
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(function() {});

  const result = await page.evaluate(function() {
    var el = document.getElementById('__NEXT_DATA__');
    if (!el) return { error: 'no __NEXT_DATA__', listings: [] };

    var data;
    try { data = JSON.parse(el.textContent); } catch(e) { return { error: 'parse error', listings: [] }; }

    var pp = data && data.props && data.props.pageProps;
    if (!pp) return { error: 'no pageProps', listings: [] };

    // Log structure so we know what keys exist and their sizes
    var keys = Object.keys(pp).map(function(k) {
      return k + ':' + JSON.stringify(pp[k]).length;
    });

    // Walk ALL arrays in pageProps looking for objects with id+price (listing shape)
    var found = [];
    function walk(obj, depth) {
      if (depth > 4 || !obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        if (obj.length > 0 && obj[0] && (obj[0].id || obj[0].listingId) && (obj[0].price != null || obj[0].address)) {
          obj.forEach(function(l) {
            var id = l.id || l.listingId || l.listing_id;
            if (!id) return;
            found.push({
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
        obj.forEach(function(item) { walk(item, depth + 1); });
      } else {
        Object.values(obj).forEach(function(v) { walk(v, depth + 1); });
      }
    }
    walk(pp, 0);

    return { keys: keys.join(' | '), listingCount: found.length, listings: found };
  });

  log.info('__NEXT_DATA__ keys: ' + (result.keys || result.error));
  log.info('Found ' + (result.listings || []).length + ' listings');
  return result.listings || [];
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
