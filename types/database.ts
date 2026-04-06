export type Profile = {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan: 'free' | 'pro'
  stripe_customer_id: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export type Monitor = {
  id: string
  user_id: string
  name: string
  is_active: boolean
  neighborhoods: string[]
  bedrooms: number[] | null
  min_price: number | null
  max_price: number
  no_fee: boolean
  pet_friendly: boolean
  laundry_in_unit: boolean
  laundry_in_building: boolean
  amenities: string[]
  scan_interval: number
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export type ListingMatch = {
  id: string
  monitor_id: string
  user_id: string
  listing_id: string
  title: string | null
  address: string | null
  neighborhood: string | null
  bedrooms: number | null
  price: number | null
  no_fee: boolean | null
  pet_friendly: boolean | null
  has_laundry: boolean | null
  image_url: string | null
  listing_url: string
  alert_sent: boolean
  alert_sent_at: string | null
  listed_at: string | null
  found_at: string
}

export type ScraperRun = {
  id: string
  monitor_id: string
  apify_run_id: string | null
  status: 'running' | 'succeeded' | 'failed'
  listings_found: number
  new_matches: number
  started_at: string
  finished_at: string | null
}
