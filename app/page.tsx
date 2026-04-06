import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  // If already logged in, go straight to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <span className="font-semibold text-zinc-900">StreetSnipe</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2">
            Log in
          </Link>
          <Link href="/signup" className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors font-medium">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" style={{ animation: 'live-pulse 2s ease-in-out infinite' }} />
          Scanning StreetEasy every 10 minutes
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 leading-tight mb-4 tracking-tight">
          Snipe NYC apartments<br />before anyone else
        </h1>

        <p className="text-base text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
          Set your criteria. StreetSnipe scans StreetEasy around the clock and emails
          you the moment a matching rental appears.
        </p>

        <Link
          href="/signup"
          className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Start monitoring — free
        </Link>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 text-left">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              ),
              title: 'Set your criteria',
              body: 'Neighborhoods, price, bedrooms, no-fee — exactly like StreetEasy filters.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              ),
              title: 'We scan nonstop',
              body: 'Automated checks every 10 minutes. You sleep, we watch.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17H2a3 3 0 003 3h14a3 3 0 003-3z" /><path d="M6 12V7a6 6 0 0112 0v5" />
                </svg>
              ),
              title: 'Instant alerts',
              body: 'Get emailed the second a new listing matches. Be first to inquire.',
            },
          ].map(f => (
            <div key={f.title}>
              <div className="mb-2">{f.icon}</div>
              <h3 className="font-semibold text-zinc-900 text-sm mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-20 pt-16 border-t border-zinc-100">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Pricing</h2>
          <p className="text-zinc-500 text-sm mb-8">Free to start. Upgrade for speed.</p>

          <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <div className="rounded-lg p-5 border border-zinc-200">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Free</div>
              <div className="text-3xl font-bold text-zinc-900 mb-4">$0</div>
              <ul className="space-y-2 text-sm text-zinc-600 mb-5">
                <li>1 monitor</li>
                <li>Daily scans</li>
                <li>Email alerts</li>
              </ul>
              <Link href="/signup" className="block text-center border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                Get started
              </Link>
            </div>
            <div className="rounded-lg p-5 bg-zinc-900 text-white">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Pro</div>
              <div className="text-3xl font-bold mb-1">$9.99<span className="text-sm font-normal text-zinc-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-zinc-300 mt-4 mb-5">
                <li>Unlimited monitors</li>
                <li>Scans every 10 min</li>
                <li>Priority alerts</li>
              </ul>
              <Link href="/signup" className="block text-center bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
