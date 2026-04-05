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

  // Wait for network to settle
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(function() {});

  // Dump page state so we can see exactly what StreetEasy serves
  const debug = await page.evaluate(function() {
    var title = document.title;
    var url = window.location.href;

    // All element counts for common listing selectors
    var selectors = [
      'li[class*="listing"]', 'li[class*="SearchResult"]', '[data-id]',
      '[data-listing-id]', 'article', 'li.item', '[class*="unitCard"]',
      '[class*="listingCard"]', '[class*="SearchResultCard"]', 'ul li a[href*="/rental/"]'
    ];
    var counts = {};
    selectors.forEach(function(s) {
      try { counts[s] = document.querySelectorAll(s).length; } catch(e) { counts[s] = -1; }
    });

    // __NEXT_DATA__ keys
    var nextKeys = 'none';
    var nextSample = '';
    var el = document.getElementById('__NEXT_DATA__');
    if (el) {
      try {
        var nd = JSON.parse(el.textContent);
        var pp = nd.props && nd.props.pageProps;
        if (pp) {
          nextKeys = Object.keys(pp).map(function(k) {
            var size = JSON.stringify(pp[k]).length;
            return k + '(' + size + ')';
          }).join(', ');
          // Sample first large key
          var big = Object.entries(pp).sort(function(a,b){ return JSON.stringify(b[1]).length - JSON.stringify(a[1]).length; })[0];
          if (big) nextSample = big[0] + ':' + JSON.stringify(big[1]).slice(0,300);
        }
      } catch(e) { nextKeys = 'parse error: ' + e.message; }
    }

    // First 5 rental links on page
    var links = [];
    document.querySelectorAll('a[href*="/rental/"]').forEach(function(a) {
      if (links.length < 5) links.push(a.href);
    });

    return { title: title, url: url, selectors: counts, nextKeys: nextKeys, nextSample: nextSample, rentalLinks: links };
  });

  log.info('PAGE TITLE: ' + debug.title);
  log.info('PAGE URL: ' + debug.url);
  log.info('NEXT_DATA keys: ' + debug.nextKeys);
  log.info('NEXT_DATA sample: ' + debug.nextSample);
  log.info('SELECTOR COUNTS: ' + JSON.stringify(debug.selectors));
  log.info('RENTAL LINKS: ' + JSON.stringify(debug.rentalLinks));

  // Return debug as single item so we can read it from the dataset
  return [debug];
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
