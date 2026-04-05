'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor } from '@/types/database'

export default function MonitorControls({ monitor }: { monitor: Monitor }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    await fetch(`/api/monitors/${monitor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !monitor.is_active }),
    })
    router.refresh()
    setLoading(false)
  }

  async function deleteMonitor() {
    if (!confirm('Delete this monitor? All match history will be removed.')) return
    setLoading(true)
    await fetch(`/api/monitors/${monitor.id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleActive}
        disabled={loading}
        className="text-sm border border-[#E8E0D5] text-[#6B5E52] px-4 py-2 rounded-full hover:bg-[#F0EBE1] transition-colors disabled:opacity-50"
      >
        {monitor.is_active ? 'Pause' : 'Resume'}
      </button>
      <button
        onClick={deleteMonitor}
        disabled={loading}
        className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}
