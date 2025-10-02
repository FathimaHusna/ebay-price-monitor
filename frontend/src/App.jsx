import React from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <header className="bg-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <h1 className="text-lg font-semibold flex-1">ebay Price Monitor</h1>
          <nav className="flex gap-6">
            <Link className="hover:text-indigo-300" to="/dashboard">Dashboard</Link>
            <Link className="hover:text-indigo-300" to="/products">Products</Link>
          </nav>
          {token ? (
            <button onClick={logout} className="bg-indigo-600 px-4 py-2 rounded-lg">Logout</button>
          ) : null}
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
