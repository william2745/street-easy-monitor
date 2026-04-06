'use client'

import { useEffect, useState } from 'react'
import { addMinutes } from 'date-fns'

export default function CountdownTimer({
  lastRunAt,
  scanInterval,
}: {
  lastRunAt: string | null
  scanInterval: number
}) {
  const [label, setLabel] = useState('...')

  useEffect(() => {
    function update() {
      if (!lastRunAt) {
        setLabel('Awaiting first scan')
        return
      }
      const next = addMinutes(new Date(lastRunAt), scanInterval)
      const diff = next.getTime() - Date.now()
      if (diff <= 0) {
        setLabel('Due now')
        return
      }
      const totalSecs = Math.floor(diff / 1000)
      const hrs = Math.floor(totalSecs / 3600)
      const mins = Math.floor((totalSecs % 3600) / 60)
      const secs = totalSecs % 60

      if (hrs > 0) setLabel(`${hrs}h ${mins}m`)
      else if (mins > 0) setLabel(`${mins}m ${secs}s`)
      else setLabel(`${secs}s`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [lastRunAt, scanInterval])

  return <span>{label}</span>
}
