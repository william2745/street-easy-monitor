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
      className="w-full border border-warm-400 text-warm-700 py-2.5 rounded-lg text-sm hover:bg-warm-200 transition-colors">
      Sign out
    </button>
  )
}
