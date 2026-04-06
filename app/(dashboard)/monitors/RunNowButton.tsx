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
      className={`shrink-0 text-[11px] px-2 py-0.5 rounded transition-colors disabled:opacity-50 font-medium ${
        status === 'error'
          ? 'text-red-500 bg-red-50 border border-red-200'
          : status === 'queued'
          ? 'text-violet-600 bg-violet-50 border border-violet-200'
          : 'text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-200'
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-1">
          <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          scan
        </span>
      ) : status === 'queued' ? 'queued' : status === 'error' ? 'failed' : 'scan'}
    </button>
  )
}
