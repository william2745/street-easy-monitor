import { Monitor } from '@/types/database'
import { buildSearchUrl } from './buildSearchUrl'

const APIFY_API_BASE = 'https://api.apify.com/v2'
// Use Apify's free Playwright Scraper — renders JavaScript so StreetEasy's
// client-side listing results are visible. No rental required.
const ACTOR_ID = 'apify~playwright-scraper'

// Page function — waits for StreetEasy listings to load then extracts them.
// Residential proxies ensure the page loads without PerimeterX blocking.
const STREETEASY_PAGE_FUNCTION = /* js */ `
async function pageFunction(context) {
  const { page, log } = context;

  // Wait for listing cards or network idle
  await Promise.race([
    page.waitForSelector('li[class*="listing"], [data-id], article[class*="result"]', { timeout: 20000 }),
    page.waitForLoadState('networkidle', { timeout: 20000 }),
  ]).catch(function() { log.warning('wait timeout, extracting anyway'); });

  const listings = await page.evaluate(function() {
    var found = [];

    // 1. Walk __NEXT_DATA__ — deep search for arrays that look like listings
    var el = document.getElementById('__NEXT_DATA__');
    if (el) {
      try {
        var pp = JSON.parse(el.textContent).props.pageProps;
        function walk(obj, depth) {
          if (depth > 5 || !obj || typeof obj !== 'object') return;
          if (Array.isArray(obj)) {
            if (obj.length > 0 && obj[0] && (obj[0].id || obj[0].listingId) && obj[0].price != null) {
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
            obj.forEach(function(i) { walk(i, depth + 1); });
          } else {
            Object.values(obj).forEach(function(v) { walk(v, depth + 1); });
          }
        }
        walk(pp, 0);
      } catch(e) {}
    }

    // 2. DOM fallback — rendered listing cards
    if (found.length === 0) {
      document.querySelectorAll('li[class*="listing"], article[class*="result"], [data-id]').forEach(function(card) {
        var lid = card.getAttribute('data-id') || card.getAttribute('data-listing-id');
        var link = (card.querySelector('a[href*="/rental/"]') || card.querySelector('a')||{}).href;
        if (!link && !lid) return;
        var priceEl = card.querySelector('[class*="price"]');
        var addrEl = card.querySelector('[class*="address"]');
        found.push({
          listingId: lid || null,
          url: link || ('https://streeteasy.com/rental/' + lid),
          address: addrEl ? addrEl.textContent.trim() : null,
          price: priceEl ? parseInt(priceEl.textContent.replace(/\\D/g,''),10)||null : null,
        });
      });
    }

    return found;
  });

  log.info('Extracted ' + listings.length + ' listings from ' + page.url());
  return listings;
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
        // Residential proxies bypass StreetEasy's PerimeterX bot detection.
        // Covered by Apify's $5/month free platform credits.
        proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        // Use real Chrome (harder to detect than Chromium) + stealth args
        useChrome: true,
        launchContext: {
          launchOptions: {
            args: ['--disable-blink-features=AutomationControlled'],
          },
        },
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
