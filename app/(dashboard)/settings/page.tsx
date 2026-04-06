import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-md">
      <h1 className="text-[15px] font-semibold text-zinc-900 mb-5">Settings</h1>

      <div className="border border-zinc-200 rounded-lg p-5 mb-4">
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Account</div>
        <div className="text-[13px] text-zinc-900">{user?.email}</div>
      </div>

      <SignOutButton />
    </div>
  )
}
