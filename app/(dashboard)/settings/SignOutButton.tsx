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
    <button
      onClick={handleSignOut}
      className="w-full border border-red-200 text-red-500 py-2.5 rounded-full text-sm hover:bg-red-50 transition-colors"
    >
      Sign out
    </button>
  )
}
