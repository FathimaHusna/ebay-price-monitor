import React from 'react'
import { formatCurrency } from '../utils/formatters'

export default function Dashboard({ data, onCheckNow, busyId }) {
  const products = data?.products || []
  const unread = data?.alertsUnread || 0
  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="border border-slate-200 rounded-lg p-3 bg-white">Products: {products.length}</div>
        <div className="border border-slate-200 rounded-lg p-3 bg-white">Unread Alerts: {unread}</div>
      </div>
      <div className="grid gap-3">
        {products.map((p) => (
          <div key={p._id} className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-3">
              <strong className="flex-1">{p.name}</strong>
              <span className="text-sm text-slate-600">Your Price: {formatCurrency(p.myCurrentPrice)}</span>
              {onCheckNow ? (
                <button disabled={busyId === p._id} onClick={() => onCheckNow(p._id)} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">
                  {busyId === p._id ? 'Checking…' : 'Check Now'}
                </button>
              ) : null}
            </div>
            <ul>
              {p.competitors?.map((c) => (
                <li key={c._id}>
                  {c.name || 'Unknown'} — {c.url} — Price: {formatCurrency(c.currentPrice)} — Last: {c.lastChecked ? new Date(c.lastChecked).toLocaleString() : '-'}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
