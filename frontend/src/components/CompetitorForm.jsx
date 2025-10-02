import React, { useState } from 'react'
import api from '../services/api'

export default function CompetitorForm({ productId, onAdded }) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post(`/products/${productId}/competitors`, { url, name })
      setUrl('')
      setName('')
      onAdded?.()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-center mt-2">
      <input className="border rounded px-3 py-2 flex-1" placeholder="eBay URL or mock://listing?price=999" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="border rounded px-3 py-2" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={busy} type="submit" className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Add</button>
      {error ? <span className="text-red-600">{error}</span> : null}
    </form>
  )
}
