---
name: StreetSnipe — NYC Rental Monitor SaaS
description: Full-stack Next.js SaaS that monitors StreetEasy every 15 min and emails alerts for matching NYC rentals
type: project
---

StreetSnipe is Will's side project — a paid SaaS that monitors StreetEasy for NYC rental listings matching user-defined criteria and sends email alerts.

**Stack:** Next.js 14 (App Router) + Supabase (auth + DB) + Stripe (billing) + Apify (StreetEasy scraping) + Resend (email)

**Tiers:**
- Free: 1 monitor, daily scans, no email alerts
- Pro: $9.99/mo, unlimited monitors, 15-min scans, instant email alerts

**How:** Supabase Edge Function (pg_cron, */15 min) triggers Apify actor for each active monitor. Apify scrapes StreetEasy and POSTs results to `/api/webhooks/scraper`. New listings are deduplicated, stored in `listing_matches`, and emailed via Resend (pro only).

**Why:** NYC rental market is hyper-competitive. 15-min edge on new listings is the value prop.

**Status (as of April 2026):** Full scaffold built and builds cleanly. Needs env vars and services set up before going live. See SETUP.md in repo.

**How to apply:** When Will asks about this project, reference the existing architecture rather than re-planning. The scraper, webhook handler, Stripe integration, and all pages are built.
