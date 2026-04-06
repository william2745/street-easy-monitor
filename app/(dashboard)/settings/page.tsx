import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage your account</p>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-5 mb-4">
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Email</div>
        <div className="text-sm text-zinc-900">{user?.email}</div>
      </div>

      <SignOutButton />
    </div>
  )
}
