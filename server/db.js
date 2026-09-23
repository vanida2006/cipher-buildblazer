// Built-in SQLite (Node >= 22.13): no native compile step, works on Windows out of the box.
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
  venue       TEXT,
  summary     TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '[]',   -- JSON array of paragraphs
  gallery     TEXT NOT NULL DEFAULT '[]',   -- JSON array of {src, caption}
  featured    INTEGER NOT NULL DEFAULT 1
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
`);

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
} catch (err) {
  console.warn('[CIPHER] Auto-seed note:', err.message);
}

module.exports = db;
