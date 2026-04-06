'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PhoneNumberForm({ userId, initialPhone }: { userId: string; initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus('idle')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ phone_number: phone || null })
      .eq('id', userId)
    setSaving(false)
    setStatus(error ? 'error' : 'saved')
    if (!error) setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSave}>
      <div className="bg-warm-50 rounded-xl p-6 border border-warm-400 mb-4">
        <div className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">SMS Alerts</div>
        <p className="text-xs text-warm-600 mb-3">Pro plan — enter your number to receive text alerts for new matches.</p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="flex-1 border border-warm-400 rounded-lg px-3 py-2 text-sm text-warm-900 bg-white placeholder:text-warm-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {status === 'saved' && <p className="text-xs text-green-600 mt-2">Phone number saved.</p>}
        {status === 'error' && <p className="text-xs text-red-600 mt-2">Failed to save. Try again.</p>}
      </div>
    </form>
  )
}
