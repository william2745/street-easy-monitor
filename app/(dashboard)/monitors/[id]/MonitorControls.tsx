'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Monitor } from '@/types/database'

export default function MonitorControls({ monitor }: { monitor: Monitor }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [runStatus, setRunStatus] = useState<'idle' | 'queued' | 'error'>('idle')

  async function runNow() {
    setScanning(true)
    setRunStatus('idle')
    const res = await fetch(`/api/monitors/${monitor.id}/run-now`, { method: 'POST' })
    setScanning(false)
    if (res.ok) {
      setRunStatus('queued')
      router.refresh()
      setTimeout(() => setRunStatus('idle'), 6000)
    } else {
      setRunStatus('error')
      setTimeout(() => setRunStatus('idle'), 6000)
    }
  }

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
    router.push('/monitors')
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={runNow}
        disabled={scanning}
        className={`text-sm px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${
          runStatus === 'error'
            ? 'bg-red-100 text-red-600 border border-red-200'
            : runStatus === 'queued'
            ? 'bg-[#E8F5E9] text-green-700'
            : 'bg-[#F5E8DC] text-[#C4703A] hover:bg-[#EDD9C6]'
        }`}
      >
        {scanning ? 'Triggering…' : runStatus === 'queued' ? 'Scan queued ✓' : runStatus === 'error' ? 'Failed — retry?' : 'Check now'}
      </button>
      <Link
        href={`/monitors/${monitor.id}/edit`}
        className="text-sm border border-[#E8E0D5] text-[#6B5E52] px-4 py-2 rounded-full hover:bg-[#F0EBE1] transition-colors"
      >
        Edit
      </Link>
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
