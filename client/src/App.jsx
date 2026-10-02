import { useState } from 'react'
import AuthForm from './AuthForm.jsx'
import Dashboard from './Dashboard.jsx'

export default function App() {
  // Keep the logged-in user in state; the token itself lives in localStorage
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  function handleLogin({ token, user }) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <AuthForm onLogin={handleLogin} />
}