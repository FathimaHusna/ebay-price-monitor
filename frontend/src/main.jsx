import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import './index.css'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="products" element={<RequireAuth><Products /></RequireAuth>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
