import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl text-[#2C2420] mb-8">Settings</h1>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.08)] mb-4">
        <div className="text-sm font-medium text-[#2C2420] mb-1">Account</div>
        <div className="text-sm text-[#6B5E52]">{user?.email}</div>
      </div>

      <SignOutButton />
    </div>
  )
}
