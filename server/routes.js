const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { z } = require('zod');
const { uploadDir } = require('./paths');
const { db, logActivity } = require('./db');
const { sign, requireAdmin, requireRole } = require('./auth');

const ROLES = ['SUPER_ADMIN', 'EVENT_MANAGER', 'CONTENT_MANAGER'];

const api = express.Router();

/* ---------- helpers ---------- */
const parseEvent = (r) => ({
  ...r,
  featured: !!r.featured,
  published: r.published !== 0,
  body: typeof r.body === 'string' ? JSON.parse(r.body || '[]') : (r.body || []),
  gallery: typeof r.gallery === 'string' ? JSON.parse(r.gallery || '[]') : (r.gallery || []),
  poster: r.poster || (r.gallery && JSON.parse(r.gallery || '[]')[0]?.src) || null,
  event_time: r.event_time || null,
  reg_link: r.reg_link || null,
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Optional: post new applications to a Discord/Slack-style webhook (set JOIN_WEBHOOK_URL). */
function notifyWebhook(text) {
  const url = process.env.JOIN_WEBHOOK_URL;
  if (!url) return;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text, text, allowed_mentions: { parse: [] } }),
  }).catch((e) => console.warn('Webhook failed:', e.message));
}

/* ---------- public: read ---------- */
api.get('/health', (_req, res) => res.json({ ok: true }));

api.get('/leadership', (_req, res) => {
  res.json(db.prepare('SELECT * FROM members WHERE active = 1 ORDER BY sort_order, id').all());
});

api.get('/events', (_req, res) => {
  const rows = db.prepare('SELECT * FROM events WHERE published = 1 ORDER BY event_date DESC').all();
  res.json(rows.map(parseEvent));
});

api.get('/events/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Event not found' });
  res.json(parseEvent(row));
});

api.get('/stats', (_req, res) => {
  const n = (t, where = '') => db.prepare(`SELECT COUNT(*) AS c FROM ${t} ${where}`).get().c;
  res.json({
    events: n('events', 'WHERE published = 1'),
    activities: n('activities'),
    leaders: n('members'),
    registrations: n('join_requests')
  });
});

api.get('/activities', (_req, res) => {
  res.json(db.prepare('SELECT * FROM activities ORDER BY sort_order, id').all());
});

api.get('/content', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_content').all();
  const map = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  res.json(map);
});

/* ---------- public: join form / registration ---------- */
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a few minutes.' },
});

const joinSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  usn: z.string().trim().max(20).optional().default(''),
  year: z.coerce.number().int().min(1).max(4).optional(),
  interest: z.string().trim().max(100).optional().default('Web'),
  message: z.string().trim().max(500).optional().default(''),
  website: z.string().max(0).optional(), // honeypot
});

api.post('/join', joinLimiter, validate(joinSchema), (req, res) => {
  const { name, email, usn, year, interest, message, website } = req.body;
  if (website) return res.status(201).json({ ok: true }); // silently drop bots

  const dup = db.prepare(
    "SELECT 1 FROM join_requests WHERE email = ? AND created_at > datetime('now','-1 day')"
  ).get(email);
  if (dup) return res.status(409).json({ error: 'You already applied today. We will reach out soon.' });

  db.prepare(
    'INSERT INTO join_requests (name,email,usn,year,interest,message) VALUES (?,?,?,?,?,?)'
  ).run(name, email, usn, year ?? null, interest ?? 'General', message);

  logActivity('System', 'registration_received', `New registration received from ${name} (${email})`);
  notifyWebhook(`New CIPHER application: ${name} (${email})${year ? `, year ${year}` : ''}${interest ? `, interested in ${interest}` : ''}`);
  res.status(201).json({ ok: true, message: 'Application received. Welcome to CIPHER.' });
});

/* ---------- admin: auth ---------- */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

api.post(['/manage/login', '/admin/login', '/manage/auth/login'], loginLimiter,
  validate(z.object({ username: z.string().min(1), password: z.string().min(1) })),
  (req, res) => {
    const rawUser = req.body.username.trim();
    const rawPass = req.body.password;
    const admin = db.prepare('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)').get(rawUser);
    const ok = admin && admin.status === 'active' && bcrypt.compareSync(rawPass, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });

    db.prepare('UPDATE admins SET last_login = datetime(\'now\') WHERE id = ?').run(admin.id);
    logActivity(admin.username, 'admin_login', `Admin logged in successfully: ${admin.username}`);
    res.json({ token: sign(admin), username: admin.username, id: admin.id, role: admin.role, name: admin.name });
  });

/* ---------- admin: CRUD & Dashboard ---------- */
const admin = express.Router();
admin.use(requireAdmin);

// Session check & Profile
admin.get('/me', (req, res) => {
  const row = db.prepare('SELECT id, username, name, email, role, profile_image, status, created_at, last_login FROM admins WHERE id = ?').get(req.admin.sub);
  if (!row) return res.status(404).json({ error: 'Admin account not found' });
  res.json(row);
});

// Change Password
admin.post('/change-password', validate(z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
})), (req, res) => {
  const currentAdmin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.sub);
  if (!currentAdmin) return res.status(404).json({ error: 'Admin account not found' });

  const valid = bcrypt.compareSync(req.body.current_password, currentAdmin.password_hash);
  if (!valid) return res.status(400).json({ error: 'Incorrect current password' });

  const hash = bcrypt.hashSync(req.body.new_password, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, req.admin.sub);
  logActivity(req.admin.u, 'password_changed', 'Password updated successfully');
  res.json({ ok: true, message: 'Password updated successfully' });
});

// Dashboard Overview Stats
admin.get('/stats', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const totalEvents = db.prepare('SELECT COUNT(*) AS c FROM events').get().c;
  const upcomingEvents = db.prepare('SELECT COUNT(*) AS c FROM events WHERE event_date >= ?').get(today).c;
  const publishedEvents = db.prepare('SELECT COUNT(*) AS c FROM events WHERE published = 1').get().c;
  const totalRegistrations = db.prepare('SELECT COUNT(*) AS c FROM join_requests').get().c;
  const newRegistrations = db.prepare("SELECT COUNT(*) AS c FROM join_requests WHERE status = 'new'").get().c;
  const totalMembers = db.prepare('SELECT COUNT(*) AS c FROM members').get().c;
  const totalActivities = db.prepare('SELECT COUNT(*) AS c FROM activities').get().c;

  res.json({
    totalEvents,
    upcomingEvents,
    publishedEvents,
    totalRegistrations,
    newRegistrations,
    totalMembers,
    totalActivities
  });
});

// Recent Activity Log (SUPER_ADMIN only)
admin.get('/activity-log', requireRole('SUPER_ADMIN'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const logs = db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?').all(limit);
  res.json(logs);
});

/* ---------- Event Management ---------- */
const eventSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().max(160).optional(),
  category: z.string().min(1).max(50),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  event_time: z.string().max(80).nullish(),
  venue: z.string().max(140).nullish(),
  reg_link: z.string().max(300).nullish().or(z.literal('')),
  poster: z.string().max(400).nullish().or(z.literal('')),
  summary: z.string().min(1).max(800),
  body: z.array(z.string()).default([]),
  gallery: z.array(z.object({ src: z.string(), caption: z.string().nullish() })).default([]),
  featured: z.boolean().default(true),
  published: z.boolean().default(true),
});

const eventAccess = requireRole('SUPER_ADMIN', 'EVENT_MANAGER');

// List all events for admin (including unpublished)
admin.get('/events', eventAccess, (_req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY event_date DESC').all();
  res.json(rows.map(parseEvent));
});

// Single event
admin.get('/events/:id', eventAccess, (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found' });
  res.json(parseEvent(row));
});

// Add New Event
admin.post('/events', eventAccess, validate(eventSchema), (req, res) => {
  const e = req.body;
  let targetSlug = e.slug ? slugify(e.slug) : slugify(e.title);
  if (!targetSlug) targetSlug = `event-${Date.now()}`;

  // Ensure unique slug
  let slug = targetSlug;
  let counter = 1;
  while (db.prepare('SELECT id FROM events WHERE slug = ?').get(slug)) {
    slug = `${targetSlug}-${counter++}`;
  }

  try {
    const info = db.prepare(
      `INSERT INTO events (slug, title, category, event_date, event_time, venue, reg_link, poster, summary, body, gallery, featured, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      e.title,
      e.category,
      e.event_date,
      e.event_time || null,
      e.venue || null,
      e.reg_link || null,
      e.poster || null,
      e.summary,
      JSON.stringify(e.body),
      JSON.stringify(e.gallery),
      e.featured ? 1 : 0,
      e.published ? 1 : 0
    );

    logActivity(req.admin.u, 'event_created', `New event created: "${e.title}" (${e.category})`);
    res.status(201).json({ id: info.lastInsertRowid, slug });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'An event with this title or slug already exists' });
    }
    throw err;
  }
});

// Edit Event
admin.put('/events/:id', eventAccess, validate(eventSchema), (req, res) => {
  const e = req.body;
  const existing = db.prepare('SELECT id, slug FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const targetSlug = e.slug ? slugify(e.slug) : existing.slug;

  const info = db.prepare(
    `UPDATE events SET
      slug = ?,
      title = ?,
      category = ?,
      event_date = ?,
      event_time = ?,
      venue = ?,
      reg_link = ?,
      poster = ?,
      summary = ?,
      body = ?,
      gallery = ?,
      featured = ?,
      published = ?
     WHERE id = ?`
  ).run(
    targetSlug,
    e.title,
    e.category,
    e.event_date,
    e.event_time || null,
    e.venue || null,
    e.reg_link || null,
    e.poster || null,
    e.summary,
    JSON.stringify(e.body),
    JSON.stringify(e.gallery),
    e.featured ? 1 : 0,
    e.published ? 1 : 0,
    req.params.id
  );

  if (!info.changes) return res.status(404).json({ error: 'Event update failed' });
  logActivity(req.admin.u, 'event_updated', `Event updated: "${e.title}"`);
  res.json({ ok: true, slug: targetSlug });
});

// Toggle Publish / Unpublish Event
admin.patch('/events/:id/publish', eventAccess, validate(z.object({ published: z.boolean() })), (req, res) => {
  const existing = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  db.prepare('UPDATE events SET published = ? WHERE id = ?').run(req.body.published ? 1 : 0, req.params.id);
  logActivity(req.admin.u, req.body.published ? 'event_published' : 'event_unpublished',
    `Event ${req.body.published ? 'published' : 'unpublished'}: "${existing.title}"`);
  res.json({ ok: true, published: req.body.published });
});

// Delete Event
admin.delete('/events/:id', eventAccess, (req, res) => {
  const existing = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id);
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Event not found' });

  logActivity(req.admin.u, 'event_deleted', `Event deleted: "${existing ? existing.title : req.params.id}"`);
  res.status(204).end();
});

/* ---------- Registration Management ---------- */
const regAccess = requireRole('SUPER_ADMIN', 'EVENT_MANAGER');

admin.get('/join-requests', regAccess, (req, res) => {
  const { status, q, interest } = req.query;
  let sql = 'SELECT * FROM join_requests WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (interest && interest !== 'all') {
    sql += ' AND interest = ?';
    params.push(interest);
  }
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    sql += ' AND (name LIKE ? OR email LIKE ? OR usn LIKE ? OR message LIKE ?)';
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

admin.post('/join-requests', regAccess, validate(z.object({
  name: z.string().min(2),
  email: z.string().email(),
  usn: z.string().optional().default(''),
  year: z.coerce.number().optional().default(1),
  interest: z.string().optional().default('Web'),
  message: z.string().optional().default(''),
  status: z.enum(['new', 'contacted', 'accepted', 'rejected']).default('new'),
})), (req, res) => {
  const d = req.body;
  const info = db.prepare(
    'INSERT INTO join_requests (name, email, usn, year, interest, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(d.name, d.email, d.usn || '', d.year, d.interest, d.message, d.status);

  logActivity(req.admin.u, 'registration_created', `Manually added registration for ${d.name}`);
  res.status(201).json({ id: info.lastInsertRowid });
});

admin.patch('/join-requests/:id', regAccess, validate(z.object({ status: z.enum(['new', 'contacted', 'accepted', 'rejected']) })),
  (req, res) => {
    const existing = db.prepare('SELECT name FROM join_requests WHERE id=?').get(req.params.id);
    const info = db.prepare('UPDATE join_requests SET status=? WHERE id=?').run(req.body.status, req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Registration not found' });

    logActivity(req.admin.u, 'registration_status', `Updated status to "${req.body.status}" for ${existing ? existing.name : 'ID ' + req.params.id}`);
    res.json({ ok: true });
  });

admin.delete('/join-requests/:id', regAccess, (req, res) => {
  const existing = db.prepare('SELECT name FROM join_requests WHERE id=?').get(req.params.id);
  const info = db.prepare('DELETE FROM join_requests WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Registration not found' });

  logActivity(req.admin.u, 'registration_deleted', `Deleted registration for ${existing ? existing.name : 'ID ' + req.params.id}`);
  res.status(204).end();
});

admin.get('/join-requests.csv', regAccess, (_req, res) => {
  const rows = db.prepare('SELECT * FROM join_requests ORDER BY id DESC').all();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
  const head = ['id', 'name', 'email', 'usn', 'year', 'interest', 'message', 'status', 'created_at'];
  const csv = [head.join(','), ...rows.map((r) => head.map((h) => esc(r[h])).join(','))].join('\n');
  res.type('text/csv').attachment('cipher-registrations.csv').send(csv);
});

/* ---------- Leadership / Members Management ---------- */
const memberSchema = z.object({
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(60),
  image: z.string().max(300).nullish(),
  github: z.string().nullish().or(z.literal('')),
  linkedin: z.string().nullish().or(z.literal('')),
  instagram: z.string().nullish().or(z.literal('')),
  email: z.string().email().nullish().or(z.literal('')),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

const contentAccess = requireRole('SUPER_ADMIN', 'CONTENT_MANAGER');

admin.get('/leadership', contentAccess, (_req, res) => {
  res.json(db.prepare('SELECT * FROM members ORDER BY sort_order, id').all());
});

admin.post('/leadership', contentAccess, validate(memberSchema), (req, res) => {
  const m = req.body;
  const info = db.prepare(
    'INSERT INTO members (name,role,image,github,linkedin,instagram,email,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(m.name, m.role, m.image ?? null, m.github || null, m.linkedin || null, m.instagram || null, m.email || null, m.active ? 1 : 0, m.sort_order);

  logActivity(req.admin.u, 'member_created', `Added member: ${m.name} (${m.role})`);
  res.status(201).json({ id: info.lastInsertRowid });
});

admin.put('/leadership/:id', contentAccess, validate(memberSchema), (req, res) => {
  const m = req.body;
  const info = db.prepare(
    'UPDATE members SET name=?, role=?, image=?, github=?, linkedin=?, instagram=?, email=?, active=?, sort_order=? WHERE id=?'
  ).run(m.name, m.role, m.image ?? null, m.github || null, m.linkedin || null, m.instagram || null, m.email || null, m.active ? 1 : 0, m.sort_order, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Member not found' });

  logActivity(req.admin.u, 'member_updated', `Updated member: ${m.name}`);
  res.json({ ok: true });
});

admin.delete('/leadership/:id', contentAccess, (req, res) => {
  const existing = db.prepare('SELECT name FROM members WHERE id=?').get(req.params.id);
  const info = db.prepare('DELETE FROM members WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Member not found' });

  logActivity(req.admin.u, 'member_deleted', `Removed member: ${existing ? existing.name : req.params.id}`);
  res.status(204).end();
});

/* ---------- Activities Management ---------- */
const activitySchema = z.object({
  title: z.string().min(1).max(140),
  url: z.string().nullish().or(z.literal('')),
  sort_order: z.coerce.number().int().default(0),
});

admin.get('/activities', contentAccess, (_req, res) => {
  res.json(db.prepare('SELECT * FROM activities ORDER BY sort_order, id').all());
});

admin.post('/activities', contentAccess, validate(activitySchema), (req, res) => {
  const a = req.body;
  const info = db.prepare('INSERT INTO activities (title,url,sort_order) VALUES (?,?,?)')
    .run(a.title, a.url || null, a.sort_order);

  logActivity(req.admin.u, 'activity_created', `Added activity: ${a.title}`);
  res.status(201).json({ id: info.lastInsertRowid });
});

admin.put('/activities/:id', contentAccess, validate(activitySchema), (req, res) => {
  const a = req.body;
  const info = db.prepare('UPDATE activities SET title=?, url=?, sort_order=? WHERE id=?')
    .run(a.title, a.url || null, a.sort_order, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Activity not found' });

  logActivity(req.admin.u, 'activity_updated', `Updated activity: ${a.title}`);
  res.json({ ok: true });
});

admin.delete('/activities/:id', contentAccess, (req, res) => {
  const existing = db.prepare('SELECT title FROM activities WHERE id=?').get(req.params.id);
  const info = db.prepare('DELETE FROM activities WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Activity not found' });

  logActivity(req.admin.u, 'activity_deleted', `Deleted activity: ${existing ? existing.title : req.params.id}`);
  res.status(204).end();
});

/* ---------- Website Content Management ---------- */
admin.get('/content', contentAccess, (_req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM site_content').all();
  const map = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  res.json(map);
});

admin.put('/content', contentAccess, validate(z.record(z.string(), z.string())), (req, res) => {
  const entries = Object.entries(req.body);
  const now = new Date().toISOString();
  for (const [k, v] of entries) {
    const exist = db.prepare('SELECT key FROM site_content WHERE key = ?').get(k);
    if (exist) {
      db.prepare('UPDATE site_content SET value = ?, updated_at = ? WHERE key = ?').run(v, now, k);
    } else {
      db.prepare('INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)').run(k, v, now);
    }
  }

  logActivity(req.admin.u, 'content_updated', `Updated website content configurations (${entries.length} fields)`);
  res.json({ ok: true, message: 'Content updated successfully' });
});

/* ---------- Admin File / Image Upload ---------- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 10 } });

function sniffImage(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  if (b.length > 12 && b.subarray(0, 4).toString() === '<svg' || b.subarray(0, 50).toString().includes('<svg')) return 'svg';
  return 'jpg'; // safe fallback
}

admin.post('/upload', upload.array('file', 10), (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ error: 'No files received' });

  const urls = [];
  for (const file of files) {
    const ext = sniffImage(file.buffer);
    const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, name), file.buffer);
    urls.push(`/uploads/${name}`);
  }

  res.status(201).json({
    url: urls[0],
    urls,
    count: urls.length
  });
});

/* ---------- Admin User & Role Management (SUPER_ADMIN only) ---------- */
const superOnly = requireRole('SUPER_ADMIN');
const adminSafeCols = 'id, username, name, email, role, profile_image, status, created_at, last_login';

admin.get('/admins', superOnly, (_req, res) => {
  res.json(db.prepare(`SELECT ${adminSafeCols} FROM admins ORDER BY id`).all());
});

const newAdminSchema = z.object({
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, 'Letters, numbers, dot, dash, underscore only'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  name: z.string().max(80).nullish().or(z.literal('')),
  email: z.string().email().nullish().or(z.literal('')),
  role: z.enum(ROLES).default('CONTENT_MANAGER'),
});

admin.post('/admins', superOnly, validate(newAdminSchema), (req, res) => {
  const a = req.body;
  const existing = db.prepare('SELECT id FROM admins WHERE LOWER(username) = LOWER(?)').get(a.username);
  if (existing) return res.status(409).json({ error: 'That username is already taken' });

  const hash = bcrypt.hashSync(a.password, 12);
  const info = db.prepare(
    'INSERT INTO admins (username, password_hash, name, email, role, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(a.username, hash, a.name || null, a.email || null, a.role, 'active');

  logActivity(req.admin.u, 'admin_created', `Created admin account "${a.username}" with role ${a.role}`);
  res.status(201).json({ id: info.lastInsertRowid });
});

const updateAdminSchema = z.object({
  name: z.string().max(80).nullish().or(z.literal('')),
  email: z.string().email().nullish().or(z.literal('')),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

admin.put('/admins/:id', superOnly, validate(updateAdminSchema), (req, res) => {
  const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });

  if (String(target.id) === String(req.admin.sub) && (req.body.role || req.body.status === 'inactive')) {
    return res.status(400).json({ error: 'You cannot change your own role or deactivate yourself.' });
  }

  const next = {
    name: req.body.name !== undefined ? (req.body.name || null) : target.name,
    email: req.body.email !== undefined ? (req.body.email || null) : target.email,
    role: req.body.role || target.role,
    status: req.body.status || target.status,
  };

  db.prepare('UPDATE admins SET name=?, email=?, role=?, status=? WHERE id=?')
    .run(next.name, next.email, next.role, next.status, req.params.id);

  logActivity(req.admin.u, 'admin_updated', `Updated admin "${target.username}" (role: ${next.role}, status: ${next.status})`);
  res.json({ ok: true });
});

admin.post('/admins/:id/reset-password', superOnly, validate(z.object({
  password: z.string().min(10, 'Password must be at least 10 characters'),
})), (req, res) => {
  const target = db.prepare('SELECT username FROM admins WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });

  const hash = bcrypt.hashSync(req.body.password, 12);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  logActivity(req.admin.u, 'admin_password_reset', `Reset password for admin "${target.username}"`);
  res.json({ ok: true });
});

api.use(['/admin', '/manage'], admin);

module.exports = api;
