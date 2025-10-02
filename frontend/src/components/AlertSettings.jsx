import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function AlertSettings() {
  const [thresholdPercent, setThreshold] = useState(5)
  const [frequency, setFrequency] = useState('immediate')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/auth/preferences')
        if (data) {
          setThreshold(data.thresholdPercent ?? 5)
          setFrequency(data.frequency ?? 'immediate')
          setEmailEnabled(!!data.emailEnabled)
        }
      } catch (_) {}
    })()
  }, [])

  async function save(e) {
    e.preventDefault()
    setStatus('')
    try {
      await api.put('/auth/preferences', { thresholdPercent, frequency, emailEnabled })
      setStatus('Saved')
    } catch (err) {
      setStatus(err.response?.data?.error || err.message)
    }
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <label>
        Threshold %
        <input type="number" min={0} step={0.1} value={thresholdPercent} onChange={(e) => setThreshold(Number(e.target.value))} />
      </label>
      <label>
        Frequency
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="immediate">Immediate</option>
          <option value="daily">Daily</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} /> Email alerts enabled
      </label>
      <button type="submit">Save</button>
      {status ? <span>{status}</span> : null}
    </form>
  )
}

