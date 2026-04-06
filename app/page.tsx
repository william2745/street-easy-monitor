import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (data?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </div>
          <span className="font-serif text-xl text-warm-900">StreetSnipe</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-warm-700 hover:text-warm-900 transition-colors">Sign in</Link>
          <Link href="/signup" className="text-sm bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors font-medium shadow-sm">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-20 sm:pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark text-xs font-medium px-3.5 py-1.5 rounded-full mb-8 border border-brand-medium">
          <span className="w-1.5 h-1.5 bg-brand rounded-full" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          Scanning StreetEasy every 10 minutes
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl text-warm-900 leading-[1.1] mb-6">
          Snipe NYC apartments<br />before anyone else
        </h1>

        <p className="text-lg text-warm-700 max-w-lg mx-auto mb-10 leading-relaxed">
          Set your criteria. StreetSnipe watches StreetEasy around the clock and emails you
          the instant a matching rental hits the market.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-brand text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors shadow-sm"
          >
            Start monitoring — it&apos;s free
          </Link>
          <Link href="/login" className="text-sm text-warm-700 hover:text-warm-900 transition-colors">
            Already have an account?
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 pb-24">
        <h2 className="font-serif text-2xl text-warm-900 text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Set your criteria',
              desc: 'Pick neighborhoods, price range, bedrooms, and amenities — exactly like StreetEasy filters.',
            },
            {
              num: '02',
              title: 'We scan nonstop',
              desc: 'Automated checks as often as every 10 minutes. New listings are caught within minutes of posting.',
            },
            {
              num: '03',
              title: 'Get alerted instantly',
              desc: 'Email the second a new match appears. Be the first to inquire, schedule a tour, or apply.',
            },
          ].map(step => (
            <div key={step.num} className="bg-warm-50 rounded-xl p-6 border border-warm-400">
              <div className="text-xs font-bold text-brand mb-3 font-mono">{step.num}</div>
              <h3 className="font-serif text-lg text-warm-900 mb-2">{step.title}</h3>
              <p className="text-sm text-warm-700 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 pb-28">
        <h2 className="font-serif text-2xl text-warm-900 text-center mb-3">Simple pricing</h2>
        <p className="text-sm text-warm-700 text-center mb-12">Start free. Upgrade when you want speed.</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-warm-50 rounded-xl p-7 border border-warm-400">
            <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-3">Free</div>
            <div className="font-serif text-4xl text-warm-900 mb-6">$0</div>
            <ul className="space-y-3 text-sm text-warm-700 mb-8">
              {['1 active monitor', 'Daily scans', 'Email alerts', 'Full match history'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-warm-500 text-warm-800 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-warm-200 transition-colors">
              Get started
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-warm-900 rounded-xl p-7 border border-warm-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Popular</div>
            <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-3">Pro</div>
            <div className="font-serif text-4xl text-white mb-1">$9.99</div>
            <div className="text-xs text-warm-600 mb-6">per month</div>
            <ul className="space-y-3 text-sm text-warm-500 mb-8">
              {['Unlimited monitors', 'Scans every 10 minutes', 'Instant email alerts', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-400 py-8 text-center text-xs text-warm-600">
        StreetSnipe — NYC Rental Monitor
      </footer>
    </div>
  )
}
