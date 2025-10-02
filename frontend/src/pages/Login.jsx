import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test1234')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await api.post(url, { email, password })
      if (data?.token) {
        localStorage.setItem('token', data.token)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h2 className="text-center text-2xl font-semibold mb-4">{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={submit} className="grid gap-3">
        <input className="border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{mode === 'login' ? 'Login' : 'Create account'}</button>
      </form>
      {error ? <p className="text-red-600 mt-2">{error}</p> : null}
      <p className="mt-3">
        {mode === 'login' ? (
          <button className="text-blue-700 hover:underline" onClick={() => setMode('register')}>Need an account? Register</button>
        ) : (
          <button className="text-blue-700 hover:underline" onClick={() => setMode('login')}>Have an account? Login</button>
        )}
      </p>
    </div>
  )
}
