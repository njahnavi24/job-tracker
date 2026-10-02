import { useState } from 'react'
import { api } from './api.js'

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: form })
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>
        <h1>Job Tracker</h1>
        <p className="muted">Keep every application in one place.</p>

        {mode === 'register' && (
          <label>Name
            <input name="name" value={form.name} onChange={set} required />
          </label>
        )}
        <label>Email
          <input name="email" type="email" value={form.email} onChange={set} required />
        </label>
        <label>Password
          <input name="password" type="password" minLength={6} value={form.password} onChange={set} required />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="primary" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <p className="muted center">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </main>
  )
}