import { Monitor } from '@/types/database'

const NYC_NEIGHBORHOOD_SLUGS: Record<string, string> = {
  // Manhattan
  'upper-west-side': 'upper-west-side',
  'upper-east-side': 'upper-east-side',
  'harlem': 'harlem',
  'washington-heights': 'washington-heights',
  'inwood': 'inwood',
  'hell-s-kitchen': 'hell-s-kitchen',
  'midtown': 'midtown',
  'murray-hill': 'murray-hill',
  'gramercy': 'gramercy',
  'chelsea': 'chelsea',
  'west-village': 'west-village',
  'greenwich-village': 'greenwich-village',
  'soho': 'soho',
  'tribeca': 'tribeca',
  'financial-district': 'financial-district',
  'lower-east-side': 'lower-east-side',
  'east-village': 'east-village',
  'nolita': 'nolita',
  'chinatown': 'chinatown',
  'battery-park-city': 'battery-park-city',
  'kips-bay': 'kips-bay',
  'lincoln-square': 'lincoln-square',
  'morningside-heights': 'morningside-heights',
  'hamilton-heights': 'hamilton-heights',
  // Brooklyn
  'williamsburg': 'williamsburg',
  'greenpoint': 'greenpoint',
  'park-slope': 'park-slope',
  'brooklyn-heights': 'brooklyn-heights',
  'cobble-hill': 'cobble-hill',
  'carroll-gardens': 'carroll-gardens',
  'boerum-hill': 'boerum-hill',
  'fort-greene': 'fort-greene',
  'clinton-hill': 'clinton-hill',
  'prospect-heights': 'prospect-heights',
  'crown-heights': 'crown-heights',
  'bedford-stuyvesant': 'bedford-stuyvesant',
  'bushwick': 'bushwick',
  'ridgewood': 'ridgewood',
  'sunset-park': 'sunset-park',
  'bay-ridge': 'bay-ridge',
  'flatbush': 'flatbush',
  'ditmas-park': 'ditmas-park',
  'dyker-heights': 'dyker-heights',
  // Queens
  'astoria': 'astoria',
  'long-island-city': 'long-island-city',
  'sunnyside': 'sunnyside',
  'jackson-heights': 'jackson-heights',
  'forest-hills': 'forest-hills',
  'flushing': 'flushing',
  'jamaica': 'jamaica',
  // Bronx
  'riverdale': 'riverdale',
  'fordham': 'fordham',
}

export function buildSearchUrl(monitor: Monitor): string {
  const base = 'https://streeteasy.com/for-rent'

  // Build neighborhood path segment
  const neighborhoodSlug = monitor.neighborhoods
    .map(n => NYC_NEIGHBORHOOD_SLUGS[n] ?? n)
    .join(',')

  const params = new URLSearchParams()

  // Price range
  if (monitor.min_price && monitor.max_price) {
    params.set('price', `${monitor.min_price}-${monitor.max_price}`)
  } else if (monitor.max_price) {
    params.set('price', `-${monitor.max_price}`)
  }

  // Bedrooms
  if (monitor.bedrooms && monitor.bedrooms.length > 0) {
    params.set('beds', monitor.bedrooms.join(','))
  }

  // Amenities
  if (monitor.no_fee) params.set('no_fee', '1')
  if (monitor.pet_friendly) params.set('pet_policy', 'allowed')
  if (monitor.laundry_in_unit) params.set('laundry', 'in_unit')
  else if (monitor.laundry_in_building) params.set('laundry', 'in_building')

  // Sort by newest
  params.set('sort_by', 'listed_desc')

  const queryString = params.toString()
  return `${base}/${neighborhoodSlug}${queryString ? '?' + queryString : ''}`
}
