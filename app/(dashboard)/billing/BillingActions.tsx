'use client'

import { useState } from 'react'

export default function BillingActions({ isPro, showUpgrade = false }: { isPro: boolean; showUpgrade?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/billing/create-checkout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      if (json.url) window.location.href = json.url
      else throw new Error('No checkout URL returned')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/billing/create-portal', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      if (json.url) window.location.href = json.url
      else throw new Error('No portal URL returned')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{error}</div>
      )}
      {showUpgrade || !isPro ? (
        <button onClick={handleUpgrade} disabled={loading}
          className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 shadow-sm">
          {loading ? 'Redirecting...' : 'Upgrade to Pro'}
        </button>
      ) : (
        <button onClick={handlePortal} disabled={loading}
          className="w-full border border-warm-400 text-warm-700 py-2.5 rounded-lg text-sm hover:bg-warm-200 transition-colors disabled:opacity-50">
          {loading ? 'Opening...' : 'Manage subscription'}
        </button>
      )}
    </div>
  )
}
