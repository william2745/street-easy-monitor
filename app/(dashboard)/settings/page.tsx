import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl text-warm-900 mb-8">Settings</h1>

      <div className="bg-warm-50 rounded-xl p-6 border border-warm-400 mb-4">
        <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">Account</div>
        <div className="text-sm text-warm-900">{user?.email}</div>
      </div>

      <SignOutButton />
    </div>
  )
}
