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
  instagram   TEXT,
  email       TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
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
  category    TEXT NOT NULL DEFAULT 'WORKSHOP',
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
  password_hash TEXT NOT NULL,
  name          TEXT,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
  profile_image TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
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

  const memberCols = db.prepare('PRAGMA table_info(members)').all().map((c) => c.name);
  if (!memberCols.includes('instagram')) db.exec('ALTER TABLE members ADD COLUMN instagram TEXT;');
  if (!memberCols.includes('email')) db.exec('ALTER TABLE members ADD COLUMN email TEXT;');
  if (!memberCols.includes('active')) db.exec('ALTER TABLE members ADD COLUMN active INTEGER NOT NULL DEFAULT 1;');

  const adminCols = db.prepare('PRAGMA table_info(admins)').all().map((c) => c.name);
  if (!adminCols.includes('name')) db.exec('ALTER TABLE admins ADD COLUMN name TEXT;');
  if (!adminCols.includes('email')) db.exec('ALTER TABLE admins ADD COLUMN email TEXT;');
  if (!adminCols.includes('role')) db.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'SUPER_ADMIN';");
  if (!adminCols.includes('profile_image')) db.exec('ALTER TABLE admins ADD COLUMN profile_image TEXT;');
  if (!adminCols.includes('status')) db.exec("ALTER TABLE admins ADD COLUMN status TEXT NOT NULL DEFAULT 'active';");
  if (!adminCols.includes('created_at')) db.exec("ALTER TABLE admins ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));");
  if (!adminCols.includes('last_login')) db.exec('ALTER TABLE admins ADD COLUMN last_login TEXT;');

  const activityCols = db.prepare('PRAGMA table_info(activities)').all().map((c) => c.name);
  if (!activityCols.includes('category')) db.exec("ALTER TABLE activities ADD COLUMN category TEXT NOT NULL DEFAULT 'WORKSHOP';");

  // One-time data migration: assign categories to existing activities
  const catMap = {
    'Industrial Visit': 'INDUSTRIAL VISIT',
    'LaTeX Tool': 'TECH TALK',
    'HackTO Future 20': 'COMPETITION',
    'Introduction to Google Crowdsource': 'TECH TALK',
    'Generative AI Tools for Research': 'RESEARCH',
    'UDAAN Mock Interview': 'CAREER PREP',
    'Freshers Onboarding Programme': 'CAREER PREP',
    'Projects Funded by KSCST': 'RESEARCH',
    'Star UML': 'TECH TALK',
  };
  const updateCat = db.prepare('UPDATE activities SET category = ? WHERE title = ? AND category = ?');
  for (const [title, cat] of Object.entries(catMap)) {
    updateCat.run(cat, title, 'WORKSHOP');
  }
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
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    db.prepare(
      `INSERT INTO admins (username, password_hash, role, name, email, status)
       VALUES (?, ?, 'SUPER_ADMIN', 'CIPHER Admin', 'cipher@sjec.ac.in', 'active')`
    ).run('admin', bcrypt.hashSync('admin123456', 12));
    console.log('[CIPHER] Initial Super Admin created with username "admin".');
  }

  const joinCount = db.prepare('SELECT COUNT(*) AS c FROM join_requests').get().c;
  if (joinCount === 0) {
    db.prepare(
      'INSERT INTO join_requests (name, email, usn, year, interest, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('Carol Vanida Quadras', '24a44.carol@sjec.ac.in', '4s024cs044', 2, 'Web', 'Application to Cipher', 'new', '2026-09-21 14:53:55');
  }

  const hasUrls = db.prepare("SELECT COUNT(*) AS c FROM activities WHERE url IS NOT NULL AND url != ''").get().c;
  if (hasUrls < 20) {
    db.exec('DELETE FROM activities;');
    const activitiesToSeed = [
      ["CIPHER Student Association", "ASSOCIATIONS", "https://sjec.ac.in/cipher", 1],
      ["CSI Student Branch", "ASSOCIATIONS", "https://sjec.ac.in/csi", 2],
      ["Google Developer Student Club", "ASSOCIATIONS", "https://sjec.ac.in/google-developer-club", 3],
      ["Intel Unnati Artificial Intelligence Laboratory", "AI & TECH HUBS", "https://sjec.ac.in/intel-unnati-artificial-intelligence-laboratory", 4],
      ["Azure AI Foundry Technical Session", "AI & TECH HUBS", "https://sjec.ac.in/events/tech-session-on-azure-ai-foundry", 5],
      ["Applied Machine Learning Workshop", "AI & TECH HUBS", "https://sjec.ac.in/cipher/activity/applied-machine-learning", 6],
      ["HackTO Future 20", "EVENTS", "https://sjec.ac.in/cipher/activity/hackto-future-20", 7],
      ["The Winter Hackathon 2026", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/the-winter-hackathon-2026", 8],
      ["Tech It Out Quiz Competition", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/tech-it-out", 9],
      ["CSE Tiara 2019 – Bazzinga", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/cse-tiara-2019-report-on-bazzinga", 10],
      ["CSE Tiara 2019 – Papyrus", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/cse-tiara-2019-report-on-papyrus", 11],
      ["CIPHER Inaugural", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/cse-student-association-cipher-inaugural", 12],
      ["Branch Entry", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/branch-entry-1", 13],
      ["Awareness on Certification Courses", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/awareness-on-certification-courses-offered-by-cse", 14],
      ["Cyber Security & Career Pathways", "EVENTS", "https://sjec.ac.in/index.php/department/computer-science/activity/a-hands-on-session-on-cyber-security-career-pathways", 15],
      ["Writing an IEEE Research Paper", "EVENTS", "https://sjec.ac.in/department/computer-science/activity/cse-session-on-writing-an-ieee-research-paper", 16],
      ["Student Outreach Program – Kukkaje", "OUTREACH", "https://sjec.ac.in/index.php/department/computer-science/activity/student-out-reach-program", 17],
      ["Student Outreach Program – Padumarnaadu", "OUTREACH", "https://sjec.ac.in/index.php/department/computer-science/activity/student-outreach-program", 18],
      ["Student Outreach Program – Kankanady and Jokatte", "OUTREACH", "https://sjec.ac.in/index.php/department/computer-science/activity/student-outreach-program-2", 19],
      ["Freshers Onboarding Programme", "OUTREACH", "https://sjec.ac.in/cipher/activity/freshers-onboarding-programme", 20]
    ];
    const insertAct = db.prepare('INSERT INTO activities (title, category, url, sort_order) VALUES (?, ?, ?, ?)');
    for (const act of activitiesToSeed) {
      insertAct.run(act[0], act[1], act[2], act[3]);
    }
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
