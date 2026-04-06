import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarNav from './SidebarNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-warm-100 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-warm-50 border-r border-warm-400 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="px-6 pt-6 pb-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <span className="font-serif text-xl text-warm-900">StreetSnipe</span>
          </Link>
        </div>

        {/* New Monitor CTA */}
        <div className="px-4 mb-4">
          <Link
            href="/monitors/new"
            className="flex items-center justify-center gap-2 w-full bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Monitor
          </Link>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* User */}
        <div className="mt-auto px-4 py-4 border-t border-warm-400">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center text-sm font-medium text-warm-700">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-warm-900 truncate">{user.email}</div>
            </div>
          </div>
          <form action={signOut}>
            <button className="w-full text-left text-sm text-warm-600 hover:text-warm-900 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
