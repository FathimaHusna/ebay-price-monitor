import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function EbayPriceMonitorDashboard() {
  const [dash, setDash] = useState({ products: [], alertsUnread: 0 })
  const [alerts, setAlerts] = useState([])
  const [prefs, setPrefs] = useState({ thresholdPercent: 5, frequency: 'immediate', emailEnabled: true })
  const [saving, setSaving] = useState(false)
  const [runningAll, setRunningAll] = useState(false)
  const [runSummary, setRunSummary] = useState(null)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmailMsg, setTestEmailMsg] = useState(null)

  async function load() {
    const [d, a, p] = await Promise.all([
      api.get('/dashboard').then(r => r.data),
      api.get('/alerts').then(r => r.data),
      api.get('/auth/preferences').then(r => r.data).catch(() => null)
    ])
    setDash(d)
    setAlerts(a?.slice(0, 5) || [])
    if (p) setPrefs(p)
  }

  useEffect(() => { load() }, [])

  const productCount = dash.products?.length || 0
  const activeAlerts = dash.alertsUnread || 0
  const avgMargin = useMemo(() => {
    const margins = (dash.products || []).map(p => Number(p.profitMargin)).filter(n => !isNaN(n))
    if (!margins.length) return 0
    return (margins.reduce((a,b)=>a+b,0) / margins.length)
  }, [dash])

  async function savePrefs() {
    setSaving(true)
    try {
      await api.put('/auth/preferences', prefs)
    } finally {
      setSaving(false)
    }
  }

  async function runAllChecks() {
    setRunningAll(true)
    setRunSummary(null)
    try {
      const { data } = await api.post('/products/check-now')
      setRunSummary(data)
      await load()
    } catch (err) {
      setRunSummary({ ok: false, error: err.response?.data?.error || err.message })
    } finally {
      setRunningAll(false)
    }
  }

  async function sendTestEmail() {
    setTestingEmail(true)
    setTestEmailMsg(null)
    try {
      const { data } = await api.post('/alerts/test')
      setTestEmailMsg(data?.ok ? 'Test email sent successfully.' : 'Test email failed.')
    } catch (err) {
      setTestEmailMsg(`Error: ${err?.response?.data?.error || err.message}`)
    } finally {
      setTestingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">ebay Price Monitor</h1>
          <nav className="flex items-center gap-6">
            <span className="relative rounded-full px-5 py-2 font-medium bg-indigo-700/70 shadow-inner">Dashboard</span>
            <Link to="/products" className="hover:text-indigo-200">Products</Link>
          </nav>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-600/30" />
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Key Metrics</h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
                  <p className="text-gray-700 font-medium">Products Monitored</p>
                  <div className="mt-3 text-5xl font-extrabold tracking-tight">{productCount}</div>
                  <p className="mt-2 text-sm text-gray-500">Dashboard data updated</p>
                  <Link to="/products" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add Product</Link>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
                  <p className="text-gray-700 font-medium">Active Price Alerts</p>
                  <div className="mt-3 flex items-end gap-3">
                    <span className={`text-5xl font-extrabold ${activeAlerts ? 'text-red-600' : 'text-emerald-600'}`}>{activeAlerts}</span>
                    {activeAlerts ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-1 text-sm font-semibold text-red-700">&#9888;</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Unread alerts</p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
                  <p className="text-gray-700 font-medium">Average Profit Margin</p>
                  <div className="mt-3 text-5xl font-extrabold tracking-tight">{avgMargin.toFixed(1)}%</div>
                  <div className="mt-2 text-sm text-gray-600">based on your products</div>
                  <Link to="/products" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">View Products</Link>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button onClick={runAllChecks} disabled={runningAll} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {runningAll ? 'Running All Checks…' : 'Run All Checks'}
                </button>
                <button onClick={sendTestEmail} disabled={testingEmail} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                  {testingEmail ? 'Sending Test…' : 'Send Test Email'}
                </button>
                {runSummary && (
                  <div className={`text-sm ${runSummary.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {runSummary.ok
                      ? `Checked ${runSummary.productsChecked} products, ${runSummary.competitorsChecked} competitors. Alerts: ${runSummary.alertsTriggered}.`
                      : `Error: ${runSummary.error}`}
                  </div>
                )}
                {testEmailMsg && (
                  <div className={`text-sm ${/^(Error)/.test(testEmailMsg) ? 'text-red-700' : 'text-emerald-700'}`}>{testEmailMsg}</div>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Latest Activity</h2>
              <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5">
                {!alerts.length ? (
                  <p className="text-gray-600">No recent alerts.</p>
                ) : (
                  <ul className="space-y-4">
                    {alerts.map(a => (
                      <li key={a._id} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${a.alertType === 'price_drop' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {a.alertType === 'price_drop' ? '↓' : '↑'}
                        </div>
                        <p className="text-gray-700">
                          <span className="font-medium">{a.alertType === 'price_drop' ? 'Price Dropped' : 'Price Increased'}</span>:
                          {' '}from ${a.oldPrice?.toFixed?.(2)} to ${a.newPrice?.toFixed?.(2)} ({a.percentChange?.toFixed?.(2)}%)
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="rounded-2xl bg-gradient-to-b from-indigo-900 to-indigo-700 p-1 shadow-xl">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                <h3 className="text-white text-lg font-semibold">Monitoring Settings</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-white/80">Threshold (%)</label>
                    <input
                      type="number"
                      value={prefs.thresholdPercent ?? 5}
                      onChange={e => setPrefs(v => ({ ...v, thresholdPercent: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-white/80">Frequency</label>
                    <select
                      value={prefs.frequency}
                      onChange={e => setPrefs(v => ({ ...v, frequency: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-white/80">Email alerts enabled</span>
                    <button
                      onClick={() => setPrefs(v => ({ ...v, emailEnabled: !v.emailEnabled }))}
                      className={`relative h-6 w-11 rounded-full transition ${prefs.emailEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                      aria-label="toggle email"
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${prefs.emailEnabled ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <button onClick={savePrefs} disabled={saving} className="mt-3 w-full rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white shadow hover:bg-indigo-600 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
