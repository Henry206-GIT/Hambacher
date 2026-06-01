const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const db = new Database(process.env.DB_PATH || 'footprints.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS footprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exhibition_id TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT DEFAULT '',
    color TEXT DEFAULT '#ff6b35',
    size REAL DEFAULT 1.0,
    x REAL NOT NULL,
    y REAL DEFAULT 0,
    z REAL NOT NULL,
    quat_x REAL DEFAULT 0,
    quat_y REAL DEFAULT 0,
    quat_z REAL DEFAULT 0,
    quat_w REAL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migrations für bestehende DBs
['y REAL DEFAULT 0', 'quat_x REAL DEFAULT 0', 'quat_y REAL DEFAULT 0',
 'quat_z REAL DEFAULT 0', 'quat_w REAL DEFAULT 1'].forEach(col => {
  try { db.exec(`ALTER TABLE footprints ADD COLUMN ${col}`); } catch (_) {}
});

app.use(cors());
app.use(express.json());

// Debug-Log vom Client (sendBeacon → text/plain). Schreibt nach debug.log.
app.post('/api/log', express.text({ type: '*/*', limit: '16kb' }), (req, res) => {
  const line = `${new Date().toISOString()}  ${(req.body || '').toString().slice(0, 2000)}\n`;
  fs.appendFile(path.join(__dirname, 'debug.log'), line, () => {});
  res.sendStatus(204);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/src/:file', (req, res) => {
  const allowed = ['server.js', 'package.json'];
  if (!allowed.includes(req.params.file)) return res.sendStatus(404);
  res.sendFile(path.join(__dirname, req.params.file));
});

app.get('/api/footprints/:exhibitionId', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM footprints WHERE exhibition_id = ? ORDER BY created_at DESC LIMIT 100'
  ).all(req.params.exhibitionId);
  res.json(rows);
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const num = (v, def) => (typeof v === 'number' && isFinite(v) ? v : def);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

app.post('/api/footprints/:exhibitionId', (req, res) => {
  const { name, message, color, size, x, y, z, quat_x, quat_y, quat_z, quat_w } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name required' });
  if (typeof x !== 'number' || typeof z !== 'number' || !isFinite(x) || !isFinite(z)) {
    return res.status(400).json({ error: 'Position required' });
  }

  const safeName  = name.trim().slice(0, 20);
  const safeMsg   = (typeof message === 'string' ? message : '').slice(0, 36);
  const safeColor = HEX_RE.test(color) ? color : '#00cfff';
  const safeSize  = clamp(num(size, 1.0), 0.6, 1.5);

  const result = db.prepare(`
    INSERT INTO footprints
      (exhibition_id, name, message, color, size, x, y, z, quat_x, quat_y, quat_z, quat_w)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.exhibitionId,
    safeName, safeMsg, safeColor, safeSize,
    x, num(y, 0), z,
    num(quat_x, 0), num(quat_y, 0), num(quat_z, 0), num(quat_w, 1)
  );

  res.json({ id: result.lastInsertRowid, x, y: num(y, 0), z, quat_x, quat_y, quat_z, quat_w });
});

// Admin: alle Abdrücke einer Ausstellung löschen (Token erforderlich, falls gesetzt)
app.delete('/api/footprints/:exhibitionId', (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (token && req.get('x-admin-token') !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  db.prepare('DELETE FROM footprints WHERE exhibition_id = ?').run(req.params.exhibitionId);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
