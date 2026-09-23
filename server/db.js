const { DatabaseSync } = require('node:sqlite');
const { dbPath } = require('./paths');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

function tableExists(name) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);
}
function columnExists(table, column) {
  return !!db.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name=?`).get(table, column);
}
function addColumn(table, column, type) {
  if (!columnExists(table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
}

db.exec(`
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT,
  linkedin TEXT,
  instagram TEXT,
  email TEXT,
  github TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '[]',
  gallery TEXT NOT NULL DEFAULT '[]',
  poster TEXT,
  reg_link TEXT,
  featured INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'UPCOMING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS event_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  activity_date TEXT,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  status TEXT NOT NULL DEFAULT 'VISIBLE',
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  year INTEGER,
  college TEXT NOT NULL DEFAULT '',
  usn TEXT NOT NULL DEFAULT '',
  skills TEXT NOT NULL DEFAULT '',
  interests TEXT NOT NULL DEFAULT '',
  why_join TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CONTENT_MANAGER',
  profile_image TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

try { if (tableExists('members') && !tableExists('team_members')) db.exec('ALTER TABLE members RENAME TO team_members'); } catch (e) { console.warn('[CIPHER] members migration:', e.message); }
try { if (tableExists('join_requests') && !tableExists('registrations')) db.exec('ALTER TABLE join_requests RENAME TO registrations'); } catch (e) { console.warn('[CIPHER] join_requests migration:', e.message); }

for (const [c,t] of [['description',"TEXT NOT NULL DEFAULT ''"],['instagram','TEXT'],['email','TEXT'],['active','INTEGER NOT NULL DEFAULT 1'],['created_at',"TEXT NOT NULL DEFAULT (datetime('now'))"],['updated_at',"TEXT NOT NULL DEFAULT (datetime('now'))"]]) addColumn('team_members',c,t);
for (const [c,t] of [['description',"TEXT NOT NULL DEFAULT ''"],['start_time','TEXT'],['end_time','TEXT'],['status',"TEXT NOT NULL DEFAULT 'UPCOMING'"],['created_at',"TEXT NOT NULL DEFAULT (datetime('now'))"],['updated_at',"TEXT NOT NULL DEFAULT (datetime('now'))"]] ) addColumn('events',c,t);
for (const [c,t] of [['short_description',"TEXT NOT NULL DEFAULT ''"],['activity_date','TEXT'],['category',"TEXT NOT NULL DEFAULT 'GENERAL'"],['status',"TEXT NOT NULL DEFAULT 'VISIBLE'"],['visible','INTEGER NOT NULL DEFAULT 1'],['created_at',"TEXT NOT NULL DEFAULT (datetime('now'))"],['updated_at',"TEXT NOT NULL DEFAULT (datetime('now'))"]]) addColumn('activities',c,t);
for (const [c,t] of [['phone',"TEXT NOT NULL DEFAULT ''"],['department',"TEXT NOT NULL DEFAULT ''"],['college',"TEXT NOT NULL DEFAULT ''"],['skills',"TEXT NOT NULL DEFAULT ''"],['interests',"TEXT NOT NULL DEFAULT ''"],['why_join',"TEXT NOT NULL DEFAULT ''"],['updated_at',"TEXT NOT NULL DEFAULT (datetime('now'))"]]) addColumn('registrations',c,t);
for (const [c,t] of [['name',"TEXT NOT NULL DEFAULT ''"],['email','TEXT'],['username','TEXT'],['role',"TEXT NOT NULL DEFAULT 'CONTENT_MANAGER'"],['profile_image','TEXT'],['status',"TEXT NOT NULL DEFAULT 'ACTIVE'"],['session_version','INTEGER NOT NULL DEFAULT 1'],['created_at',"TEXT NOT NULL DEFAULT (datetime('now'))"],['updated_at',"TEXT NOT NULL DEFAULT (datetime('now'))"],['last_login_at','TEXT']]) addColumn('admins',c,t);
for (const [c,t] of [['admin_id','INTEGER'],['admin_name',"TEXT NOT NULL DEFAULT 'System'"],['resource',"TEXT NOT NULL DEFAULT ''"],['details',"TEXT NOT NULL DEFAULT ''"]]) addColumn('activity_logs',c,t);

try { db.prepare("UPDATE admins SET email=COALESCE(NULLIF(email,''), username || '@ciphersjec.local') WHERE email IS NULL OR email=''").run(); } catch {}
try { db.prepare("UPDATE admins SET name=COALESCE(NULLIF(name,''), username, 'Administrator') WHERE name='' OR name IS NULL").run(); } catch {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email COLLATE NOCASE); CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date); CREATE INDEX IF NOT EXISTS idx_events_published ON events(published); CREATE INDEX IF NOT EXISTS idx_event_images_event ON event_images(event_id,sort_order); CREATE INDEX IF NOT EXISTS idx_activities_order ON activities(sort_order); CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status); CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email COLLATE NOCASE); CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at); CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);'); } catch (e) { console.warn('[CIPHER] indexes:', e.message); }

function logActivity(adminOrName, actionType, details, resource='') {
  const isObject=adminOrName && typeof adminOrName==='object';
  const id=isObject ? (adminOrName.id ?? null) : null;
  const name=isObject ? (adminOrName.name || adminOrName.email || 'System') : (adminOrName || 'System');
  try { db.prepare('INSERT INTO activity_logs(admin_id,admin_name,action_type,resource,details) VALUES(?,?,?,?,?)').run(id,name,actionType,resource,details||''); } catch (e) { console.warn('[CIPHER] log:',e.message); }
}

try {
  if (db.prepare('SELECT COUNT(*) c FROM team_members').get().c===0) require('../scripts/seed').seed(db);
  const defaults=[
    ['about_title','Who we are'],
    ['about_text','CIPHER is the student association of the Department of Computer Science & Engineering. It serves as a platform for students to nurture their technical and interpersonal skills through innovative and collaborative activities. The association strives to bridge the gap between academic knowledge and practical application, fostering a community of aspiring professionals dedicated to excellence in computing.'],
    ['hero_subtitle','Bridging academic knowledge and practical application — a community of aspiring professionals in computing.'],
    ['announcement_text','Registrations are open for upcoming hackathons and technical workshops.'],
    ['announcement_active','0'],
    ['contact_email','cipher@sjec.ac.in'],
    ['contact_location','Department of Computer Science & Engineering, SJEC Vamanjoor, Mangaluru'],
    ['contact_instagram','https://instagram.com'],
    ['contact_linkedin','https://linkedin.com'],
    ['contact_github','https://github.com']
  ];
  for(const [k,v] of defaults) if(!db.prepare('SELECT key FROM site_content WHERE key=?').get(k)) db.prepare('INSERT INTO site_content(key,value) VALUES(?,?)').run(k,v);
} catch(e) { console.warn('[CIPHER] seed/migration note:',e.message); }

db.logActivity=logActivity;
module.exports=db;
