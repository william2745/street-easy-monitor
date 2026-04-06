import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-violet-500 rounded flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </div>
          <span className="font-semibold text-[14px]">StreetSnipe</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] text-zinc-400 hover:text-white transition-colors px-2 py-1">Log in</Link>
          <Link href="/signup" className="text-[13px] bg-violet-600 text-white px-3.5 py-1.5 rounded-md hover:bg-violet-500 transition-colors font-medium">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-6 sm:px-8 pt-20 sm:pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 text-[12px] font-medium px-3 py-1 rounded-full mb-6 border border-violet-500/20">
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" style={{ animation: 'live-pulse 2s ease-in-out infinite' }} />
          Scanning StreetEasy every 10 min
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 tracking-tight">
          Snipe NYC apartments<br />
          <span className="text-violet-400">before anyone else</span>
        </h1>

        <p className="text-[15px] text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
          Set your criteria. We scan StreetEasy nonstop and email you
          the instant a matching rental appears.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/signup" className="bg-violet-600 text-white px-5 py-2.5 rounded-md text-[13px] font-semibold hover:bg-violet-500 transition-colors">
            Start for free
          </Link>
          <Link href="/login" className="text-[13px] text-zinc-500 hover:text-white transition-colors px-3 py-2.5">
            Log in
          </Link>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-6 mt-24 text-left">
          {[
            { n: '1', title: 'Set criteria', desc: 'Neighborhoods, price, beds, no-fee, pet-friendly — any combination.' },
            { n: '2', title: 'We watch', desc: 'Automated scans every 10 minutes. StreetEasy scraping, handled.' },
            { n: '3', title: 'Get alerted', desc: 'Email the second a match appears. Be first to inquire.' },
          ].map(s => (
            <div key={s.n} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="text-[11px] font-bold text-violet-400 mb-2">{s.n}</div>
              <div className="text-[14px] font-semibold text-white mb-1">{s.title}</div>
              <div className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-24 pt-16 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-1">Pricing</h2>
          <p className="text-[13px] text-zinc-500 mb-8">Free forever. Pro for power users.</p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Free</div>
              <div className="text-3xl font-bold mb-4">$0</div>
              <ul className="space-y-1.5 text-[13px] text-zinc-400 mb-5">
                <li>1 monitor</li>
                <li>Daily scans</li>
                <li>Email alerts</li>
              </ul>
              <Link href="/signup" className="block text-center border border-zinc-700 text-zinc-300 px-4 py-2 rounded-md text-[13px] font-medium hover:bg-zinc-800 transition-colors">
                Get started
              </Link>
            </div>
            <div className="bg-violet-600 rounded-lg p-5">
              <div className="text-[11px] font-bold text-violet-200 uppercase tracking-wider mb-2">Pro</div>
              <div className="text-3xl font-bold mb-0.5">$9.99</div>
              <div className="text-[12px] text-violet-200 mb-4">/month</div>
              <ul className="space-y-1.5 text-[13px] text-violet-100 mb-5">
                <li>Unlimited monitors</li>
                <li>Scans every 10min</li>
                <li>Priority alerts</li>
              </ul>
              <Link href="/signup" className="block text-center bg-white text-violet-700 px-4 py-2 rounded-md text-[13px] font-bold hover:bg-violet-50 transition-colors">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
