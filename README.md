# CIPHER — Student Association of CSE, SJEC

Matrix-themed club website with a real backend.

**Stack:** Node 22.13+ · Express 5 · built-in SQLite (`node:sqlite`, no native compile — works on Windows) · Zod validation · JWT admin auth · vanilla HTML/CSS/JS (canvas effects, no build step)

## Run it (Windows PowerShell)
```powershell
npm install
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # paste result as JWT_SECRET in .env
node scripts/seed.js
node scripts/make-admin.js admin "a-strong-password"
npm run dev
```
`node scripts/seed.js` loads the real club content (9 members, 8 events with photos from `public/img/`). Re-running it replaces members, events and activities but keeps join applications.

Site: http://localhost:3000 · Admin dashboard: http://localhost:3000/admin/

## Admin dashboard (`/admin/`)
Log in to manage everything without touching code: review and export join applications (set status new / contacted / accepted / rejected), add and edit events with photo galleries, manage leadership with portraits, and edit the activities list. Photos are uploaded straight from the browser (JPG/PNG/WebP, 4 MB max, verified by file signature, stored in `data/uploads`).

Optional: set `JOIN_WEBHOOK_URL` in `.env` (a Discord webhook works) to get a message for every new application.

## API
| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/leadership` `/api/events` `/api/events/:slug` `/api/activities` `/api/stats` | – | Site content |
| POST | `/api/admin/upload` | JWT | Image upload, returns `{url}` |
| POST | `/api/join` | – | Join form (validated, rate-limited, honeypot, 1 application/email/day) |
| POST | `/api/admin/login` | – | Returns 8h JWT |
| POST/PUT/DELETE | `/api/admin/leadership[/:id]` | JWT | Manage office bearers |
| POST/PUT/DELETE | `/api/admin/events[/:id]` | JWT | Manage events + galleries |
| POST/DELETE | `/api/admin/activities[/:id]` | JWT | Manage archive list |
| GET/PATCH | `/api/admin/join-requests[/:id]` | JWT | Review applicants (new/contacted/accepted/rejected) |
| GET | `/api/admin/join-requests.csv` | JWT | Export applicants |

Add an event:
```bash
TOKEN=$(curl -s -X POST localhost:3000/api/admin/login -H 'content-type: application/json' \
  -d '{"username":"admin","password":"..."}' | jq -r .token)
curl -X POST localhost:3000/api/admin/events -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"title":"HackCipher 2026","category":"Hackathon","event_date":"2026-11-14","summary":"24-hour build sprint.","body":["Details..."],"gallery":[{"src":"/img/hack1.jpg","caption":"Finals"}]}'
```

## Adding photos
Use the admin dashboard. It uploads to `data/uploads` (set `UPLOAD_DIR` to change) and served at `/uploads/...`.

## Deploy
SQLite needs a persistent disk, so use Render / Railway / Fly.io (not Vercel serverless):
- Build: `npm install` · Start: `npm start`
- Env: `JWT_SECRET`, `DB_PATH=/data/cipher.db` (persistent disk mounted at `/data`; uploads are stored beside it), `CORS_ORIGIN`
- After first deploy run `npm run seed` and `npm run make-admin` in the service shell.

For Vercel, swap SQLite for Postgres (Neon/Supabase): only `server/db.js` and the queries in `routes.js` change.
