'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { label: 'Feed', href: '/dashboard' },
  { label: 'Monitors', href: '/monitors' },
]

const secondaryLinks = [
  { label: 'Billing', href: '/billing' },
  { label: 'Settings', href: '/settings' },
]

export default function TopNav({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-zinc-950 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-11">
        {/* Left */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0">
            <div className="w-5 h-5 bg-violet-500 rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </div>
            <span className="font-semibold text-[13px] text-white hidden sm:block">StreetSnipe</span>
          </Link>

          <nav className="flex items-center">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 rounded text-[13px] transition-colors ${
                  isActive(link.href)
                    ? 'text-white bg-white/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/monitors/new"
            className="bg-violet-500 text-white px-3 py-1 rounded text-[12px] font-medium hover:bg-violet-400 transition-colors flex items-center gap-1"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span className="hidden sm:inline">New monitor</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 text-[12px] text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                {email.charAt(0).toUpperCase()}
              </div>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[11px] text-zinc-500 border-b border-zinc-800 truncate">{email}</div>
                  {secondaryLinks.map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block px-3 py-1.5 text-[13px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="w-full text-left px-3 py-1.5 text-[13px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-t border-zinc-800">
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
