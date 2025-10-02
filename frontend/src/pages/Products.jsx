import React, { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [margin, setMargin] = useState('')
  const [error, setError] = useState('')
  const [checkingId, setCheckingId] = useState(null)

  // Add competitor state
  const [cProdId, setCProdId] = useState('')
  const [cUrl, setCUrl] = useState('')
  const [cName, setCName] = useState('')
  const [cBusy, setCBusy] = useState(false)

  // Manage competitor (update price via mock URL)
  const [mProdId, setMProdId] = useState('')
  const [mCompId, setMCompId] = useState('')
  const [mPrice, setMPrice] = useState('')
  const [mBusy, setMBusy] = useState(false)

  async function load() {
    const { data } = await api.get('/products')
    setProducts(data)
  }

  useEffect(() => {
    load()
  }, [])

  async function addProduct(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/products', {
        name,
        category,
        myCurrentPrice: price ? Number(price) : undefined,
        profitMargin: margin ? Number(margin) : undefined
      })
      setName('')
      setCategory('')
      setPrice('')
      setMargin('')
      await load()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  async function addCompetitor(e) {
    e.preventDefault()
    if (!cProdId || !cUrl) return
    setCBusy(true)
    try {
      await api.post(`/products/${cProdId}/competitors`, { url: cUrl, name: cName || undefined })
      setCUrl('')
      setCName('')
      await load()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally {
      setCBusy(false)
    }
  }

  async function updateCompetitorPrice(e) {
    e.preventDefault()
    if (!mProdId || !mCompId || !mPrice) return
    setMBusy(true)
    try {
      const url = `mock://listing?price=${Number(mPrice)}`
      await api.patch(`/products/${mProdId}/competitors/${mCompId}`, { url })
      await load()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally {
      setMBusy(false)
    }
  }

  function lastChecked(prod) {
    const times = (prod.competitors || []).map(c => c.lastChecked ? new Date(c.lastChecked).getTime() : 0)
    const max = Math.max(0, ...times)
    return max ? new Date(max).toLocaleString() : '-'
  }

  function statusChip(p) {
    const m = Number(p.profitMargin)
    if (!isNaN(m) && m < 0) return { label: 'Low Margin Alert', cls: 'bg-red-100 text-red-700', marginCls: 'text-red-600' }
    return { label: 'Healthy Profit', cls: 'bg-green-100 text-green-700', marginCls: 'text-green-600' }
  }

  async function checkNow(id) {
    setCheckingId(id)
    try {
      await api.post(`/products/${id}/check-now`)
      await load()
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6 flex gap-6 max-w-7xl mx-auto">
        <div className="flex-1 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Your Monitored Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Your Price</th>
                  <th className="pb-2">Profit Margin</th>
                  <th className="pb-2">Last Price Check</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const chip = statusChip(p)
                  return (
                    <tr key={p._id} className="border-b last:border-none">
                      <td className="py-3">{p.name}</td>
                      <td>{p.category || '-'}</td>
                      <td>{p.myCurrentPrice != null ? `$${p.myCurrentPrice}` : '-'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-lg text-sm font-medium ${chip.cls}`}>{chip.label}</span>
                        <span className={`ml-2 ${chip.marginCls}`}>{p.profitMargin != null ? `${p.profitMargin}%` : '-'}</span>
                      </td>
                      <td>{lastChecked(p)}</td>
                      <td>
                        <button onClick={() => checkNow(p._id)} className="px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50" disabled={checkingId === p._id}>
                          {checkingId === p._id ? 'Checking…' : 'Check Now'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-80 space-y-6">
          <div className="bg-indigo-100 shadow-lg rounded-lg p-6 h-fit">
          <h3 className="text-md font-semibold mb-4">Add New Product</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Name" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} />
            <input type="text" placeholder="Category" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={category} onChange={e => setCategory(e.target.value)} />
            <input type="text" placeholder="Your Price $" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={price} onChange={e => setPrice(e.target.value)} />
            <input type="text" placeholder="Profit Margin %" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={margin} onChange={e => setMargin(e.target.value)} />
            <button onClick={addProduct} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">Add Product</button>
            {error ? <div className="text-red-600 text-sm">{error}</div> : null}
          </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-md font-semibold mb-3">Add Competitor</h3>
            <form onSubmit={addCompetitor} className="space-y-3">
              <select className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={cProdId} onChange={e => setCProdId(e.target.value)}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="Competitor Name (optional)" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={cName} onChange={e => setCName(e.target.value)} />
              <input type="text" placeholder="Competitor URL (e.g. mock://listing?price=500)" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={cUrl} onChange={e => setCUrl(e.target.value)} />
              <button disabled={cBusy} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50">{cBusy ? 'Adding…' : 'Add Competitor'}</button>
            </form>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-md font-semibold mb-3">Update Competitor (Mock)</h3>
            <form onSubmit={updateCompetitorPrice} className="space-y-3">
              <select className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={mProdId} onChange={e => { setMProdId(e.target.value); setMCompId('') }}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <select className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={mCompId} onChange={e => setMCompId(e.target.value)} disabled={!mProdId}>
                <option value="">Select Competitor</option>
                {products.find(p => p._id === mProdId)?.competitors?.map(c => (
                  <option key={c._id} value={c._id}>{c.name || c.url}</option>
                ))}
              </select>
              <input type="number" placeholder="New Price (e.g. 450)" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500" value={mPrice} onChange={e => setMPrice(e.target.value)} />
              <button disabled={mBusy || !mProdId || !mCompId} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg disabled:opacity-50">{mBusy ? 'Updating…' : 'Set Mock Price'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
