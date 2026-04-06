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
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar — tight, functional */}
      <aside className="w-48 shrink-0 bg-white border-r border-zinc-200 flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-100">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-zinc-900">StreetSnipe</span>
          </Link>
        </div>

        <SidebarNav />

        <div className="px-2 py-2 border-t border-zinc-100 mt-auto">
          <div className="px-2 py-1 text-[11px] text-zinc-400 truncate">{user.email}</div>
          <form action={signOut}>
            <button className="w-full text-left px-2 py-1 text-[12px] text-zinc-400 rounded hover:bg-zinc-50 hover:text-zinc-600 transition-colors">
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
