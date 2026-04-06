'use client'

import { useState } from 'react'

export default function BillingActions({ isPro, showUpgrade = false }: { isPro: boolean; showUpgrade?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/billing/create-checkout', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  async function handlePortal() {
    setLoading(true)
    const res = await fetch('/api/billing/create-portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  if (showUpgrade || !isPro) {
    return (
      <button onClick={handleUpgrade} disabled={loading}
        className="w-full bg-violet-600 text-white py-2 rounded-md text-[13px] font-medium hover:bg-violet-500 transition-colors disabled:opacity-50">
        {loading ? 'Redirecting...' : 'Upgrade to Pro'}
      </button>
    )
  }

  return (
    <button onClick={handlePortal} disabled={loading}
      className="w-full border border-zinc-200 text-zinc-600 py-2 rounded-md text-[13px] hover:bg-zinc-50 transition-colors disabled:opacity-50">
      {loading ? 'Opening...' : 'Manage subscription'}
    </button>
  )
}
