import { useState } from 'react'
import { STATUSES } from './constants.js'

const empty = { company: '', role: '', status: 'Applied', link: '', notes: '', applied_on: '' }

// Used for both adding a new job and editing an existing one
export default function JobForm({ job, onSave, onCancel }) {
  const [form, setForm] = useState(job ? { ...empty, ...job, link: job.link || '', notes: job.notes || '', applied_on: job.applied_on || '' } : empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <form className="card modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2>{job ? 'Edit application' : 'Add application'}</h2>
        <div className="row">
          <label>Company
            <input name="company" value={form.company} onChange={set} required autoFocus />
          </label>
          <label>Role
            <input name="role" value={form.role} onChange={set} required />
          </label>
        </div>
        <div className="row">
          <label>Status
            <select name="status" value={form.status} onChange={set}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Applied on
            <input name="applied_on" type="date" value={form.applied_on} onChange={set} />
          </label>
        </div>
        <label>Job link
          <input name="link" type="url" placeholder="https://..." value={form.link} onChange={set} />
        </label>
        <label>Notes
          <textarea name="notes" rows="3" value={form.notes} onChange={set} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}