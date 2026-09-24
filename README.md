# CIPHER — Student Association of CSE, SJEC

Matrix-themed club website with a real backend, plus a role-based Management Portal.

**Stack:** Node 22.13+ · Express 5 · built-in SQLite (`node:sqlite`, no native compile — works on Windows) · Zod validation · JWT admin auth · vanilla HTML/CSS/JS (canvas effects, no build step)

## Run it (Windows PowerShell)
```powershell
npm install
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # paste result as JWT_SECRET in .env
node scripts/seed.js
node scripts/make-admin.js admin "a-strong-password-min-10-chars" SUPER_ADMIN
npm run dev
```
`node scripts/seed.js` loads the real club content (members, events with photos from `public/img/`, activities). Re-running it replaces members, events and activities but keeps admin accounts and join applications.

Site: http://localhost:3000 · Management Portal: **http://localhost:3000/manage**

## First-run setup — creating the first Super Admin
No admin accounts are created automatically (hardcoded/predictable credentials are a security hole, so we deliberately don't seed any). On first boot with an empty `admins` table, the server logs a reminder. Create your first Super Admin with:
```bash
node scripts/make-admin.js <username> "<password, min 10 chars>" SUPER_ADMIN "<Full Name>" "<email>"
```
`ROLE` is one of `SUPER_ADMIN`, `EVENT_MANAGER`, `CONTENT_MANAGER` (defaults to `SUPER_ADMIN` if omitted). Re-running the command for an existing username updates that account's password/role. Once you have a Super Admin, create the rest of your team from inside the portal (**Admins** tab) instead of the CLI.

> **Security note if you're updating from an older version of this repo:** earlier versions auto-seeded several admin accounts with hardcoded, predictable passwords, and had a hardcoded master password that could log into *any* account. Both have been removed. If this project was ever deployed with that code, treat every one of those accounts as compromised — rotate their passwords immediately via `node scripts/make-admin.js <username> "<new password>"` or deactivate them from the **Admins** tab.

## Management Portal (`/manage`)
The portal is a separate protected area — it's not linked from the public site's navbar, and every route (frontend and API) requires a valid session. Log in at `/manage/login`.

**Roles & permissions**
| Role | Can manage |
|---|---|
| `SUPER_ADMIN` | Everything below, plus admin accounts/roles and the full activity log |
| `EVENT_MANAGER` | Events, event galleries, and join-request registrations |
| `CONTENT_MANAGER` | Activities, leadership/team members, and site content (about text, hero subtitle, contact info) |

The sidebar only shows the sections a given role can access, and the backend enforces the same permissions independently — hiding a nav item is a convenience, not the security boundary.

From the portal you can: review and export join applications (statuses: new / contacted / accepted / rejected) to CSV, create/edit/publish events with photo galleries, manage the leadership roster (including social links and a show/hide toggle so a member can be kept in the system but hidden from the public site), edit the activities archive, edit selected public content fields, and — as a Super Admin — create/deactivate admin accounts, change roles, reset passwords, and review the full audit log of admin actions.

Photos are uploaded straight from the browser (JPG/PNG/WebP, 4 MB max, verified by file signature, stored in `data/uploads`).

Optional: set `JOIN_WEBHOOK_URL` in `.env` (a Discord webhook works) to get a message for every new application.

## API
| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/leadership` `/api/events` `/api/events/:slug` `/api/activities` `/api/stats` | – | Public site content (only `active`/`published` records) |
| POST | `/api/manage/upload` | JWT | Image upload, returns `{url}` |
| POST | `/api/join` | – | Join form (validated, rate-limited, honeypot, 1 application/email/day) |
| POST | `/api/manage/auth/login` | – | Returns 8h JWT + role |
| GET | `/api/manage/me` | JWT | Current admin's profile & role |
| POST | `/api/manage/change-password` | JWT | Self-service password change |
| GET | `/api/manage/stats` | JWT | Dashboard counters |
| GET/POST/PUT/PATCH/DELETE | `/api/manage/events[/:id]` | JWT (SUPER_ADMIN, EVENT_MANAGER) | Manage events + galleries |
| GET/PATCH/DELETE | `/api/manage/join-requests[/:id]` | JWT (SUPER_ADMIN, EVENT_MANAGER) | Review applicants |
| GET | `/api/manage/join-requests.csv` | JWT (SUPER_ADMIN, EVENT_MANAGER) | Export applicants |
| GET/POST/PUT/DELETE | `/api/manage/leadership[/:id]` | JWT (SUPER_ADMIN, CONTENT_MANAGER) | Manage team members |
| GET/POST/PUT/DELETE | `/api/manage/activities[/:id]` | JWT (SUPER_ADMIN, CONTENT_MANAGER) | Manage archive list |
| GET/PUT | `/api/manage/content` | JWT (SUPER_ADMIN, CONTENT_MANAGER) | Public site content fields |
| GET | `/api/manage/activity-log` | JWT (SUPER_ADMIN only) | Full admin audit trail |
| GET/POST/PUT | `/api/manage/admins[/:id]` | JWT (SUPER_ADMIN only) | Create/edit/deactivate admin accounts |
| POST | `/api/manage/admins/:id/reset-password` | JWT (SUPER_ADMIN only) | Reset another admin's password |

`/api/admin/...` and `/admin/` still work as aliases of `/api/manage/...` and `/manage/` for backward compatibility, but new code/bookmarks should use `/manage`.

Add an event:
```bash
TOKEN=$(curl -s -X POST localhost:3000/api/manage/auth/login -H 'content-type: application/json' \
  -d '{"username":"admin","password":"..."}' | jq -r .token)
curl -X POST localhost:3000/api/manage/events -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"title":"HackCipher 2026","category":"Hackathon","event_date":"2026-11-14","summary":"24-hour build sprint.","body":["Details..."],"gallery":[{"src":"/img/hack1.jpg","caption":"Finals"}]}'
```

## Adding photos
Use the Management Portal. It uploads to `data/uploads` (set `UPLOAD_DIR` to change) and serves them at `/uploads/...`.

## Security
- Passwords are hashed with bcrypt (cost 12); the frontend never sees a hash.
- No default/seeded admin accounts, no master password — every account is created explicitly via `make-admin.js` or the Admins tab.
- Every `/manage/*` API route (not just the frontend) checks the JWT and role before doing anything.
- A Super Admin can't demote or deactivate their own account through the API (prevents accidental lockout).
- Set a strong, random `JWT_SECRET` in `.env` in any real deployment — the fallback value in `auth.js` is for local dev only.

## Deploy
SQLite needs a persistent disk, so use Render / Railway / Fly.io (not Vercel serverless):
- Build: `npm install` · Start: `npm start`
- Env: `JWT_SECRET` (required — generate with the command above), `DB_PATH=/data/cipher.db` (persistent disk mounted at `/data`; uploads are stored beside it), `CORS_ORIGIN`
- After first deploy, run `node scripts/seed.js` and `node scripts/make-admin.js <user> "<password>" SUPER_ADMIN` in the service shell.

For Vercel, swap SQLite for Postgres (Neon/Supabase): only `server/db.js` and the queries in `routes.js` change.
