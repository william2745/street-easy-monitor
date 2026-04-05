'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RunNowButton({ monitorId }: { monitorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRunNow(e: React.MouseEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/monitors/${monitorId}/run-now`, { method: 'POST' })
    setLoading(false)
    setDone(true)
    setTimeout(() => setDone(false), 5000)
    router.refresh()
  }

  return (
    <button
      onClick={handleRunNow}
      disabled={loading}
      className="shrink-0 text-xs border border-[#E8E0D5] text-[#6B5E52] px-3 py-1.5 rounded-full hover:bg-[#F0EBE1] hover:text-[#2C2420] transition-colors disabled:opacity-50"
    >
      {loading ? 'Scanning…' : done ? 'Queued ✓' : 'Check now'}
    </button>
  )
}
