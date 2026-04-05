import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-[#E8E0D5] flex flex-col">
        <div className="px-6 py-6 border-b border-[#E8E0D5]">
          <Link href="/" className="font-serif text-xl text-[#2C2420]">StreetSnipe</Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/monitors', label: 'Monitors' },
            { href: '/billing', label: 'Billing' },
            { href: '/settings', label: 'Settings' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm text-[#6B5E52] rounded-lg hover:bg-[#FAF7F2] hover:text-[#2C2420] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#E8E0D5]">
          <div className="px-3 py-2 text-xs text-[#6B5E52] truncate mb-2">{user.email}</div>
          <form action={signOut}>
            <button className="w-full text-left px-3 py-2 text-sm text-[#6B5E52] rounded-lg hover:bg-[#FAF7F2] hover:text-[#2C2420] transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
