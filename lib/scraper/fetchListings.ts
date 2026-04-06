/**
 * Custom StreetEasy scraper — replaces the $25/mo Apify actor.
 * Fetches the search results page and extracts listing data from
 * the Next.js RSC (React Server Components) flight payload embedded in the HTML.
 */

export type ScrapedListing = {
  id: string
  urlPath: string
  price: number
  bedroomCount: number
  areaName: string
  street: string
  unit: string | null
  noFee: boolean
  status: string
  photoKey: string | null
  availableAt: string | null
  livingAreaSize: number | null
  fullBathroomCount: number | null
}

export async function fetchListings(searchUrl: string): Promise<ScrapedListing[]> {
  const apiKey = process.env.SCRAPER_API_KEY
  const fetchUrl = apiKey
    ? `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(searchUrl)}&render=false`
    : searchUrl

  const res = await fetch(fetchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    },
  })

  if (!res.ok) {
    throw new Error(`StreetEasy returned ${res.status}`)
  }

  const html = await res.text()
  return parseRSCPayload(html)
}

function parseRSCPayload(html: string): ScrapedListing[] {
  // Extract all RSC flight data chunks
  const chunkPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g
  let payload = ''
  let match: RegExpExecArray | null

  while ((match = chunkPattern.exec(html)) !== null) {
    // Decode the escaped string
    try {
      payload += JSON.parse(`"${match[1]}"`)
    } catch {
      payload += match[1]
    }
  }

  if (!payload) {
    console.warn('[scraper] No RSC payload found in HTML')
    return []
  }

  // Strategy: find all JSON object fragments that look like listing nodes.
  // StreetEasy listings have these fields: "id", "areaName", "price", "street", "urlPath"
  // They appear as nested objects within the RSC payload.
  const listings: ScrapedListing[] = []
  const seen = new Set<string>()

  // Find each listing by looking for the "id":"DIGITS" pattern followed by listing fields
  // We'll scan for objects that start with {"id":" and contain areaName + price
  const nodePattern = /\{"id":"(\d+)","areaName"/g
  let nodeMatch: RegExpExecArray | null

  while ((nodeMatch = nodePattern.exec(payload)) !== null) {
    const startIdx = nodeMatch.index
    // Find the end of this JSON object by counting braces
    let depth = 0
    let endIdx = startIdx
    for (let i = startIdx; i < payload.length && i < startIdx + 5000; i++) {
      if (payload[i] === '{') depth++
      else if (payload[i] === '}') {
        depth--
        if (depth === 0) {
          endIdx = i + 1
          break
        }
      }
    }

    if (endIdx <= startIdx) continue

    const jsonStr = payload.slice(startIdx, endIdx)
    try {
      const node = JSON.parse(jsonStr)
      if (!node.id || !node.price || seen.has(node.id)) continue
      seen.add(node.id)

      // Extract first photo key
      let photoKey: string | null = null
      if (Array.isArray(node.photos) && node.photos.length > 0) {
        photoKey = node.photos[0].key ?? null
      }

      listings.push({
        id: String(node.id),
        urlPath: node.urlPath ?? '',
        price: node.price,
        bedroomCount: node.bedroomCount ?? 0,
        areaName: node.areaName ?? '',
        street: node.street ?? '',
        unit: node.displayUnit ?? node.unit ?? null,
        noFee: node.noFee === true,
        status: node.status ?? 'ACTIVE',
        photoKey,
        availableAt: node.availableAt ?? null,
        livingAreaSize: node.livingAreaSize ?? null,
        fullBathroomCount: node.fullBathroomCount ?? null,
      })
    } catch {
      // JSON parse failed for this chunk — skip
    }
  }

  return listings.filter(l => l.status !== 'INACTIVE')
}
