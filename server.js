const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new Database('footprints.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS footprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exhibition_id TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT DEFAULT '',
    color TEXT DEFAULT '#ff6b35',
    size REAL DEFAULT 1.0,
    x REAL NOT NULL,
    z REAL NOT NULL,
    rotation REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed some demo footprints for exhibition "1"
const existing = db.prepare('SELECT COUNT(*) as c FROM footprints WHERE exhibition_id = ?').get('1');
if (existing.c === 0) {
  const insert = db.prepare(`
    INSERT INTO footprints (exhibition_id, name, message, color, size, x, z, rotation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const demos = [
    ['1', 'Anna', 'Tolle Ausstellung!', '#e91e63', 1.0, -1.2, -2.5, 15],
    ['1', 'Max', 'War hier 2024', '#2196f3', 0.9, 1.5, -3.0, -20],
    ['1', 'Julia', 'Geschichte hautnah', '#4caf50', 1.1, -0.5, -1.8, 5],
    ['1', 'Tom', 'Super!', '#ff9800', 0.95, 2.0, -2.0, 30],
    ['1', 'Lisa', 'Beeindruckend', '#9c27b0', 1.05, -2.0, -1.5, -10],
    ['1', 'Felix', 'Hambacher Schloss ❤️', '#f44336', 1.0, 0.8, -3.5, 45],
  ];
  for (const d of demos) insert.run(...d);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/footprints/:exhibitionId', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM footprints WHERE exhibition_id = ? ORDER BY created_at DESC LIMIT 100'
  ).all(req.params.exhibitionId);
  res.json(rows);
});

// Minimum distance between footprint centers (metres)
const MIN_DIST = 0.75;

function findFreePosition(exhibitionId) {
  const existing = db.prepare(
    'SELECT x, z FROM footprints WHERE exhibition_id = ?'
  ).all(exhibitionId);

  function tooClose(x, z) {
    return existing.some(p => Math.hypot(p.x - x, p.z - z) < MIN_DIST);
  }

  // Try random positions in expanding rings until a free spot is found.
  // Ring radius grows so the area never gets permanently stuck.
  const MIN_R = 0.8, STEP = 0.5, MAX_R = 6.0;
  for (let r = MIN_R; r <= MAX_R; r += STEP) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * STEP;
      const x = Math.cos(angle) * (r + jitter);
      const z = -(Math.abs(Math.sin(angle) * (r + jitter)) + 0.5);
      if (!tooClose(x, z)) return { x, z };
    }
  }

  // Absolute fallback: grid slot beyond existing footprints
  const cols = Math.ceil(Math.sqrt(existing.length + 1));
  const idx  = existing.length;
  return {
    x: (idx % cols) * MIN_DIST - (cols * MIN_DIST) / 2,
    z: -(Math.floor(idx / cols) * MIN_DIST + MIN_DIST),
  };
}

app.post('/api/footprints/:exhibitionId', (req, res) => {
  const { name, message, color, size } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const { x, z } = findFreePosition(req.params.exhibitionId);
  const rotation  = (Math.random() - 0.5) * 60;

  const result = db.prepare(`
    INSERT INTO footprints (exhibition_id, name, message, color, size, x, z, rotation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.exhibitionId, name, message || '', color || '#ff6b35', size || 1.0, x, z, rotation);

  res.json({ id: result.lastInsertRowid, x, z, rotation });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
