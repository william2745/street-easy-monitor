'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button onClick={handleSignOut}
      className="w-full border border-zinc-200 text-zinc-500 py-2 rounded-md text-[13px] hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
      Log out
    </button>
  )
}
