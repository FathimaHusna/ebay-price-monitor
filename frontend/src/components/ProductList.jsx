import React, { useState } from 'react'
import { formatCurrency } from '../utils/formatters'
import CompetitorForm from './CompetitorForm'
import api from '../services/api'

export default function ProductList({ products, refresh }) {
  const [checkingId, setCheckingId] = useState(null)

  async function checkNow(id) {
    setCheckingId(id)
    try {
      await api.post(`/products/${id}/check-now`)
      await refresh?.()
    } finally {
      setCheckingId(null)
    }
  }

  if (!products?.length) return <p className="text-slate-600">No products yet.</p>
  return (
    <div className="grid gap-3">
      {products.map((p) => (
        <div key={p._id} className="border border-slate-200 rounded-lg p-3 bg-white">
          <div className="flex items-center gap-3">
            <strong className="flex-1">{p.name}</strong>
            <span className="text-sm text-slate-600">Your Price: {formatCurrency(p.myCurrentPrice)}</span>
            <button disabled={checkingId === p._id} onClick={() => checkNow(p._id)} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">
              {checkingId === p._id ? 'Checking…' : 'Check Now'}
            </button>
          </div>
          <div className="mt-2">
            <em className="text-slate-600">Competitors:</em>
            <ul className="list-disc list-inside text-sm">
              {(p.competitors || []).map((c) => (
                <li key={c._id}>
                  {c.name || 'Unknown'} — {c.url} — Price: {formatCurrency(c.currentPrice)} — Last: {c.lastChecked ? new Date(c.lastChecked).toLocaleString() : '-'}
                </li>
              ))}
            </ul>
            <CompetitorForm productId={p._id} onAdded={refresh} />
          </div>
        </div>
      ))}
    </div>
  )
}
