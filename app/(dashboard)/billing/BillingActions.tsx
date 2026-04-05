'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingActions({
  isPro,
  showUpgrade = false,
}: {
  isPro: boolean
  showUpgrade?: boolean
}) {
  const router = useRouter()
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
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full bg-[#C4703A] text-white py-2.5 rounded-full text-sm font-medium hover:bg-[#A85C2E] transition-colors disabled:opacity-50"
      >
        {loading ? 'Redirecting…' : 'Upgrade to Pro — $9.99/mo'}
      </button>
    )
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="w-full border border-[#E8E0D5] text-[#6B5E52] py-2.5 rounded-full text-sm hover:bg-[#F0EBE1] transition-colors disabled:opacity-50"
    >
      {loading ? 'Opening portal…' : 'Manage subscription'}
    </button>
  )
}
