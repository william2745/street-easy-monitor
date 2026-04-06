import { NextRequest, NextResponse } from 'next/server'

/**
 * Image proxy for StreetEasy CDN.
 * StreetEasy blocks direct image requests from external referrers,
 * so we proxy through our server with the correct headers.
 *
 * Usage: /api/img?key={photo_key}
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key || !/^[a-f0-9]{20,}$/i.test(key)) {
    return new NextResponse('Bad request', { status: 400 })
  }

  const upstream = `https://media.streeteasy.com/6/${key}-ci/0/1/fill/400/300/center/1`

  try {
    const res = await fetch(upstream, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://streeteasy.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!res.ok) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const body = await res.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    })
  } catch {
    return new NextResponse('Upstream error', { status: 502 })
  }
}
