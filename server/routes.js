const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { z } = require('zod');
const { uploadDir } = require('./paths');
const db = require('./db');
const { sign, requireAdmin } = require('./auth');

const api = express.Router();

/* ---------- helpers ---------- */
const parseEvent = (r) => ({
  ...r,
  featured: !!r.featured,
  body: JSON.parse(r.body),
  gallery: JSON.parse(r.gallery),
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
  res.json(db.prepare('SELECT * FROM members ORDER BY sort_order, id').all());
});

api.get('/events', (req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY event_date DESC').all();
  res.json(rows.map(parseEvent));
});

api.get('/events/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Event not found' });
  res.json(parseEvent(row));
});

api.get('/stats', (_req, res) => {
  const n = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  res.json({ events: n('events'), activities: n('activities'), leaders: n('members') });
});

api.get('/activities', (_req, res) => {
  res.json(db.prepare('SELECT * FROM activities ORDER BY sort_order, id').all());
});

/* ---------- public: join form ---------- */
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a few minutes.' },
});

const joinSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  usn: z.string().trim().max(20).optional().default(''),
  year: z.coerce.number().int().min(1).max(4).optional(),
  interest: z.enum(['Web', 'AI/ML', 'Cybersecurity', 'Blockchain', 'Design', 'Events', 'Other']).optional(),
  message: z.string().trim().max(500).optional().default(''),
  website: z.string().max(0).optional(), // honeypot: bots fill this, humans never see it
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
  ).run(name, email, usn, year ?? null, interest ?? null, message);

  notifyWebhook(`New CIPHER application: ${name} (${email})${year ? `, year ${year}` : ''}${interest ? `, interested in ${interest}` : ''}`);
  res.status(201).json({ ok: true, message: 'Application received. Welcome to CIPHER.' });
});

/* ---------- admin: auth ---------- */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

api.post('/admin/login', loginLimiter,
  validate(z.object({ username: z.string().min(1), password: z.string().min(1) })),
  (req, res) => {
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(req.body.username);
    const ok = admin && bcrypt.compareSync(req.body.password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign(admin) });
  });

/* ---------- admin: CRUD ---------- */
const admin = express.Router();
admin.use(requireAdmin);

const memberSchema = z.object({
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(60),
  image: z.string().max(300).nullish(),
  github: z.string().url().nullish().or(z.literal('')),
  linkedin: z.string().url().nullish().or(z.literal('')),
  sort_order: z.coerce.number().int().default(0),
});

admin.post('/leadership', validate(memberSchema), (req, res) => {
  const m = req.body;
  const info = db.prepare(
    'INSERT INTO members (name,role,image,github,linkedin,sort_order) VALUES (?,?,?,?,?,?)'
  ).run(m.name, m.role, m.image ?? null, m.github || null, m.linkedin || null, m.sort_order);
  res.status(201).json({ id: info.lastInsertRowid });
});

admin.put('/leadership/:id', validate(memberSchema), (req, res) => {
  const m = req.body;
  const info = db.prepare(
    'UPDATE members SET name=?, role=?, image=?, github=?, linkedin=?, sort_order=? WHERE id=?'
  ).run(m.name, m.role, m.image ?? null, m.github || null, m.linkedin || null, m.sort_order, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

admin.delete('/leadership/:id', (req, res) => {
  const info = db.prepare('DELETE FROM members WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

const eventSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(40),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  venue: z.string().max(120).nullish(),
  summary: z.string().min(1).max(600),
  body: z.array(z.string()).default([]),
  gallery: z.array(z.object({ src: z.string(), caption: z.string().optional() })).default([]),
  featured: z.boolean().default(true),
});

admin.post('/events', validate(eventSchema), (req, res) => {
  const e = req.body;
  try {
    const info = db.prepare(
      `INSERT INTO events (slug,title,category,event_date,venue,summary,body,gallery,featured)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(slugify(e.title), e.title, e.category, e.event_date, e.venue ?? null, e.summary,
      JSON.stringify(e.body), JSON.stringify(e.gallery), e.featured ? 1 : 0);
    res.status(201).json({ id: info.lastInsertRowid, slug: slugify(e.title) });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'An event with this title exists' });
    throw err;
  }
});

admin.put('/events/:id', validate(eventSchema), (req, res) => {
  const e = req.body;
  const info = db.prepare(
    `UPDATE events SET title=?, category=?, event_date=?, venue=?, summary=?, body=?, gallery=?, featured=? WHERE id=?`
  ).run(e.title, e.category, e.event_date, e.venue ?? null, e.summary,
    JSON.stringify(e.body), JSON.stringify(e.gallery), e.featured ? 1 : 0, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

admin.delete('/events/:id', (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

const activitySchema = z.object({
  title: z.string().min(1).max(120),
  url: z.string().url().nullish().or(z.literal('')),
  sort_order: z.coerce.number().int().default(0),
});

admin.post('/activities', validate(activitySchema), (req, res) => {
  const a = req.body;
  const info = db.prepare('INSERT INTO activities (title,url,sort_order) VALUES (?,?,?)')
    .run(a.title, a.url || null, a.sort_order);
  res.status(201).json({ id: info.lastInsertRowid });
});

admin.put('/activities/:id', validate(activitySchema), (req, res) => {
  const a = req.body;
  const info = db.prepare('UPDATE activities SET title=?, url=?, sort_order=? WHERE id=?')
    .run(a.title, a.url || null, a.sort_order, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

admin.delete('/activities/:id', (req, res) => {
  const info = db.prepare('DELETE FROM activities WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

/* ---------- admin: image upload ---------- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1 } });

// Identify the real image type from magic bytes; never trust the client's filename or MIME type.
function sniffImage(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

admin.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const ext = sniffImage(req.file.buffer);
  if (!ext) return res.status(400).json({ error: 'Only JPG, PNG or WebP images are allowed' });
  const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, name), req.file.buffer);
  res.status(201).json({ url: `/uploads/${name}` });
});

/* ---------- admin: join requests ---------- */
admin.get('/join-requests', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM join_requests WHERE status=? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM join_requests ORDER BY id DESC').all();
  res.json(rows);
});

admin.patch('/join-requests/:id', validate(z.object({ status: z.enum(['new', 'contacted', 'accepted', 'rejected']) })),
  (req, res) => {
    const info = db.prepare('UPDATE join_requests SET status=? WHERE id=?').run(req.body.status, req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });

admin.get('/join-requests.csv', (_req, res) => {
  const rows = db.prepare('SELECT * FROM join_requests ORDER BY id DESC').all();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
  const head = ['id', 'name', 'email', 'usn', 'year', 'interest', 'message', 'status', 'created_at'];
  const csv = [head.join(','), ...rows.map((r) => head.map((h) => esc(r[h])).join(','))].join('\n');
  res.type('text/csv').attachment('cipher-join-requests.csv').send(csv);
});

api.use('/admin', admin);

module.exports = api;
