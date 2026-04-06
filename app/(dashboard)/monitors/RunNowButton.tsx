'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RunNowButton({ monitorId }: { monitorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'queued' | 'error'>('idle')

  async function handleRunNow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
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
      className={`shrink-0 text-xs px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1 font-medium ${
        status === 'error'
          ? 'border border-red-200 text-red-500 bg-red-50'
          : status === 'queued'
          ? 'border border-emerald-200 text-emerald-600 bg-emerald-50'
          : 'border border-zinc-200 text-zinc-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'
      }`}
    >
      {loading ? (
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : status === 'queued' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )}
      {loading ? 'Scanning' : status === 'queued' ? 'Queued' : status === 'error' ? 'Failed' : 'Scan'}
    </button>
  )
}
