import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <span className="font-serif text-2xl text-[#2C2420]">StreetSnipe</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-[#6B5E52] hover:text-[#2C2420] transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[#C4703A] text-white px-4 py-2 rounded-full hover:bg-[#A85C2E] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-[#F5E8DC] text-[#C4703A] text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-[#C4703A] rounded-full animate-pulse" />
          Scanning StreetEasy every 15 minutes
        </div>

        <h1 className="font-serif text-6xl md:text-7xl text-[#2C2420] leading-tight mb-6">
          Be first.<br />Every time.
        </h1>

        <p className="text-lg text-[#6B5E52] max-w-xl mx-auto mb-12 leading-relaxed">
          Set your criteria. StreetSnipe watches StreetEasy around the clock and emails you the
          moment a matching rental hits the market — before anyone else sees it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-[#C4703A] text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors"
          >
            Start monitoring free
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#6B5E52] hover:text-[#2C2420] transition-colors"
          >
            Already have an account →
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-28 text-left">
          {[
            {
              title: 'Multiple monitors',
              body: 'Track different neighborhoods, bedroom counts, and budgets simultaneously.',
            },
            {
              title: 'Instant email alerts',
              body: 'Get notified the moment a match appears — not hours later.',
            },
            {
              title: 'Built for NYC',
              body: 'Every neighborhood from Inwood to Bay Ridge, with filters that match StreetEasy exactly.',
            },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)]">
              <h3 className="font-medium text-[#2C2420] mb-2">{f.title}</h3>
              <p className="text-sm text-[#6B5E52] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-28">
          <h2 className="font-serif text-3xl text-[#2C2420] mb-12">Simple pricing</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.08)] text-left">
              <div className="text-sm font-medium text-[#6B5E52] mb-4">Free</div>
              <div className="font-serif text-4xl text-[#2C2420] mb-6">$0</div>
              <ul className="space-y-3 text-sm text-[#6B5E52] mb-8">
                <li>1 active monitor</li>
                <li>Daily scans</li>
                <li>In-app match history</li>
              </ul>
              <Link href="/signup" className="block text-center border border-[#E8E0D5] text-[#2C2420] px-6 py-2.5 rounded-full text-sm hover:bg-[#F0EBE1] transition-colors">
                Get started
              </Link>
            </div>
            <div className="bg-[#2C2420] rounded-2xl p-8 text-left">
              <div className="text-sm font-medium text-[#C4703A] mb-4">Pro</div>
              <div className="font-serif text-4xl text-white mb-1">$9.99</div>
              <div className="text-xs text-[#6B5E52] mb-6">per month</div>
              <ul className="space-y-3 text-sm text-[#E8E0D5] mb-8">
                <li>Unlimited monitors</li>
                <li>Scans every 15 minutes</li>
                <li>Instant email alerts</li>
                <li>Full match history</li>
              </ul>
              <Link href="/signup" className="block text-center bg-[#C4703A] text-white px-6 py-2.5 rounded-full text-sm hover:bg-[#A85C2E] transition-colors">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
