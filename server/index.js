require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const auth = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ---------- Auth ----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    res.status(201).json({ token: makeToken(result.insertId), user: { id: result.insertId, name } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }
    res.json({ token: makeToken(user.id), user: { id: user.id, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Jobs (all routes need login) ----------
// List jobs. Optional filters: ?status=Interview&search=google
app.get('/api/jobs', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM jobs WHERE user_id = ?';
    const params = [req.userId];
    if (status && STATUSES.includes(status)) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (company LIKE ? OR role LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY created_at DESC, id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Count of jobs per status, for the dashboard
app.get('/api/jobs/stats', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) AS count FROM jobs WHERE user_id = ? GROUP BY status',
      [req.userId]
    );
    const stats = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    rows.forEach((r) => { stats[r.status] = r.count; });
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/jobs', auth, async (req, res) => {
  try {
    const { company, role, status = 'Applied', link = null, notes = null, applied_on = null } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'Company and role are required' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const [result] = await pool.query(
      'INSERT INTO jobs (user_id, company, role, status, link, notes, applied_on) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, company.trim(), role.trim(), status, link || null, notes || null, applied_on || null]
    );
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/jobs/:id', auth, async (req, res) => {
  try {
    const { company, role, status, link, notes, applied_on } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'Company and role are required' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const [result] = await pool.query(
      `UPDATE jobs SET company = ?, role = ?, status = ?, link = ?, notes = ?, applied_on = ?
       WHERE id = ? AND user_id = ?`,
      [company.trim(), role.trim(), status, link || null, notes || null, applied_on || null, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Job not found' });
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/jobs/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM jobs WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));