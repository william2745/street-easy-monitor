'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RunNowButton({ monitorId }: { monitorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'queued' | 'error'>('idle')

  async function handleRunNow(e: React.MouseEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    const res = await fetch(`/api/monitors/${monitorId}/run-now`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      setStatus('queued')
      router.refresh()
      setTimeout(() => setStatus('idle'), 6000)
    } else {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 6000)
    }
  }

  return (
    <button
      onClick={handleRunNow}
      disabled={loading}
      className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
        status === 'error'
          ? 'border border-red-200 text-red-500 bg-red-50'
          : status === 'queued'
          ? 'border border-green-200 text-green-700 bg-[#E8F5E9]'
          : 'border border-[#E8E0D5] text-[#6B5E52] hover:bg-[#F0EBE1] hover:text-[#2C2420]'
      }`}
    >
      {loading ? 'Triggering…' : status === 'queued' ? 'Queued ✓' : status === 'error' ? 'Failed' : 'Check now'}
    </button>
  )
}
