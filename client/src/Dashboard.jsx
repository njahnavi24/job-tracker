import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import JobForm from './JobForm.jsx'
import { STATUSES } from './constants.js'

export default function Dashboard({ user, onLogout }) {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState({ Applied: 0, Interview: 0, Offer: 0, Rejected: 0 })
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, job = edit
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams()
      if (filter) qs.set('status', filter)
      if (search) qs.set('search', search)
      const [list, st] = await Promise.all([api(`/jobs?${qs}`), api('/jobs/stats')])
      setJobs(list)
      setStats(st)
      setError('')
    } catch (err) {
      // Token expired or invalid: send the user back to login
      if (err.status === 401) return onLogout()
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter, search, onLogout])

  // Re-load when the filter or search changes (search is delayed a little while typing)
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function save(form) {
    if (editing && editing.id) await api(`/jobs/${editing.id}`, { method: 'PUT', body: form })
    else await api('/jobs', { method: 'POST', body: form })
    setEditing(null)
    load()
  }

  async function remove(job) {
    if (!window.confirm(`Delete ${job.role} at ${job.company}?`)) return
    try {
      await api(`/jobs/${job.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function changeStatus(job, status) {
    try {
      await api(`/jobs/${job.id}`, { method: 'PUT', body: { ...job, status } })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const total = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <div className="page">
      <header className="topbar">
        <h1>Job Tracker</h1>
        <div>
          <span className="muted">Hi, {user.name}</span>
          <button onClick={onLogout}>Log out</button>
        </div>
      </header>

      <section className="stats">
        <button className={`stat ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>
          <b>{total}</b><span>All</span>
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={`stat s-${s} ${filter === s ? 'active' : ''}`} onClick={() => setFilter(filter === s ? '' : s)}>
            <b>{stats[s]}</b><span>{s}</span>
          </button>
        ))}
      </section>

      <section className="toolbar">
        <input type="search" placeholder="Search company or role" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="primary" onClick={() => setEditing({})}>+ Add application</button>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? <p className="muted">Loading...</p> : jobs.length === 0 ? (
        <div className="empty card">
          <p>{total === 0 ? 'No applications yet. Add your first one!' : 'No applications match your filter.'}</p>
        </div>
      ) : (
        <ul className="jobs">
          {jobs.map((job) => (
            <li key={job.id} className="card job">
              <div className="job-main">
                <h3>{job.role}</h3>
                <p>{job.company}{job.applied_on && <span className="muted"> · applied {job.applied_on}</span>}</p>
                {job.notes && <p className="notes">{job.notes}</p>}
                {job.link && <a href={job.link} target="_blank" rel="noreferrer">View posting</a>}
              </div>
              <div className="job-side">
                <select className={`badge s-${job.status}`} value={job.status} onChange={(e) => changeStatus(job, e.target.value)} aria-label="Status">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <div>
                  <button onClick={() => setEditing(job)}>Edit</button>
                  <button className="danger" onClick={() => remove(job)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <JobForm job={editing.id ? editing : null} onSave={save} onCancel={() => setEditing(null)} />
      )}
    </div>
  )
}