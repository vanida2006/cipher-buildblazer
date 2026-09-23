const { DatabaseSync } = require('node:sqlite');
const { dbPath } = require('./paths');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  image       TEXT,
  github      TEXT,
  linkedin    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  event_date  TEXT NOT NULL,          -- ISO date (YYYY-MM-DD)
  event_time  TEXT,                   -- e.g. "09:30 AM - 04:30 PM"
  venue       TEXT,
  summary     TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '[]',   -- JSON array of paragraphs
  gallery     TEXT NOT NULL DEFAULT '[]',   -- JSON array of {src, caption}
  poster      TEXT,                         -- Main event poster image url
  reg_link    TEXT,                         -- Registration external or internal link
  featured    INTEGER NOT NULL DEFAULT 1,
  published   INTEGER NOT NULL DEFAULT 1    -- 1 = visible on public site, 0 = draft/unlisted
);

CREATE TABLE IF NOT EXISTS activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  url         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS join_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  usn         TEXT,
  year        INTEGER,
  interest    TEXT,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Safe migrations for newly added columns if table already existed
try {
  const pragma = db.prepare('PRAGMA table_info(events)').all();
  const colNames = pragma.map((c) => c.name);
  if (!colNames.includes('event_time')) db.exec('ALTER TABLE events ADD COLUMN event_time TEXT;');
  if (!colNames.includes('poster')) db.exec('ALTER TABLE events ADD COLUMN poster TEXT;');
  if (!colNames.includes('reg_link')) db.exec('ALTER TABLE events ADD COLUMN reg_link TEXT;');
  if (!colNames.includes('published')) db.exec('ALTER TABLE events ADD COLUMN published INTEGER NOT NULL DEFAULT 1;');
} catch (migErr) {
  console.warn('[CIPHER] Migration note:', migErr.message);
}

// Activity logger helper
function logActivity(username, action_type, details) {
  try {
    db.prepare('INSERT INTO activity_logs (username, action_type, details) VALUES (?, ?, ?)')
      .run(username || 'System', action_type, details);
  } catch (e) {
    console.warn('[CIPHER] Activity log error:', e.message);
  }
}

// Auto-seed if the database is newly initialized
try {
  const memberCount = db.prepare('SELECT COUNT(*) AS c FROM members').get().c;
  if (memberCount === 0) {
    const { seed } = require('../scripts/seed');
    seed(db);
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
  const bcrypt = require('bcryptjs');
  const adminsToAdd = [
    { username: 'admin', pass: 'cipher2026admin' },
    { username: 'aarav', pass: 'aarav2026' },
    { username: 'sneha', pass: 'sneha2026' },
    { username: 'rohan', pass: 'rohan2026' },
    { username: 'carol', pass: 'carol2026' },
    { username: 'ashna', pass: 'ashna2026' },
    { username: 'ashlin', pass: 'ashlin2026' },
  ];
  for (const a of adminsToAdd) {
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(a.username);
    if (!existing) {
      db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
        .run(a.username, bcrypt.hashSync(a.pass, 10));
      console.log(`[CIPHER] Admin created: username="${a.username}"`);
    }
  }

  const joinCount = db.prepare('SELECT COUNT(*) AS c FROM join_requests').get().c;
  if (joinCount === 0) {
    db.prepare(
      'INSERT INTO join_requests (name, email, usn, year, interest, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('Carol Vanida Quadras', '24a44.carol@sjec.ac.in', '4s024cs044', 2, 'Web', 'Application to Cipher', 'new', '2026-09-21 14:53:55');
  }

  // Seed default site_content if not present
  const defaultContent = [
    ['about_title', 'Who we are'],
    ['about_text', 'CIPHER is the student association of the Department of Computer Science & Engineering. It serves as a platform for students to nurture their technical and interpersonal skills through innovative and collaborative activities. The association strives to bridge the gap between academic knowledge and practical application, fostering a community of aspiring professionals dedicated to excellence in computing.'],
    ['hero_subtitle', 'Bridging academic knowledge and practical application — a community of aspiring professionals in computing.'],
    ['announcement_text', 'Registrations are open for upcoming hackathons and technical workshops.'],
    ['announcement_active', '0'],
    ['contact_email', 'cipher@sjec.ac.in'],
    ['contact_location', 'Department of Computer Science & Engineering, SJEC Vamanjoor, Mangaluru'],
    ['contact_instagram', 'https://instagram.com'],
    ['contact_linkedin', 'https://linkedin.com'],
    ['contact_github', 'https://github.com'],
  ];
  for (const [k, v] of defaultContent) {
    const exist = db.prepare('SELECT key FROM site_content WHERE key = ?').get(k);
    if (!exist) {
      db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run(k, v);
    }
  }

  // Seed some initial activity logs if empty
  const logCount = db.prepare('SELECT COUNT(*) AS c FROM activity_logs').get().c;
  if (logCount === 0) {
    logActivity('System', 'system_init', 'CIPHER Admin Engine initialized successfully');
    logActivity('aarav', 'event_created', 'Master the Future: Hands-on GSoC & LLMs Workshop published');
    logActivity('sneha', 'registration_status', 'Updated application status for Carol Vanida Quadras');
    logActivity('rohan', 'content_updated', 'Synchronized departmental objectives and calendar');
  }
} catch (err) {
  console.warn('[CIPHER] Auto-seed note:', err.message);
}

db.db = db;
db.logActivity = logActivity;
module.exports = db;
