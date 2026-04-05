# StreetSnipe Setup Guide

## 1. Supabase

1. Create a project at supabase.com
2. Run migrations in order via the SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_indexes.sql`
3. Copy your project URL and anon key from Settings → API

## 2. Stripe

1. Create a product in the Stripe dashboard: "StreetSnipe Pro"
2. Add a recurring price: $9.99/month
3. Copy the Price ID (starts with `price_`)
4. Set up a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`
   - Listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the webhook signing secret

## 3. Apify

1. Create an account at apify.com
2. Copy your API token from Settings → Integrations
3. The default actor is `memo23/apify-streeteasy-cheerio` — verify it's available in the Apify Store

## 4. Resend

1. Create an account at resend.com
2. Add and verify your sending domain (e.g. streetsnipe.co)
3. Copy your API key
4. Update `EMAIL_FROM` in `.env.local` to your verified domain address

## 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

## 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel dashboard under Settings → Environment Variables.

## 7. Schedule the Scraper (Supabase Edge Function)

Deploy the Edge Function:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy trigger-scraper-runs
npx supabase secrets set APIFY_API_TOKEN=... SCRAPER_WEBHOOK_SECRET=... NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Then schedule it via the Supabase SQL editor (see `supabase/migrations/004_cron.sql` for the exact SQL).
You need to enable the `pg_cron` and `pg_net` extensions first in Supabase → Database → Extensions.

## 8. Local Development

```bash
npm run dev
```

App runs at http://localhost:3000
