# CIPHER — Student Association of CSE, SJEC

Matrix-themed club website with a real backend.

**Stack:** Node 20+ · Express 5 · SQLite (better-sqlite3) · Zod validation · JWT admin auth · vanilla HTML/CSS/JS (canvas effects, no build step)

## Run it
```bash
npm install
cp .env.example .env          # set JWT_SECRET to a long random string
npm run seed                  # loads leadership, events, activities
npm run make-admin -- admin "a-strong-password"
npm run dev                   # http://localhost:3000
```

## API
| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/leadership` `/api/events` `/api/events/:slug` `/api/activities` | – | Site content |
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
Drop images in `public/img/` and reference them as `/img/name.jpg` (member `image`, or event `gallery[].src`).

## Deploy
SQLite needs a persistent disk, so use Render / Railway / Fly.io (not Vercel serverless):
- Build: `npm install` · Start: `npm start`
- Env: `JWT_SECRET`, `DB_PATH=/data/cipher.db` (persistent disk mounted at `/data`), `CORS_ORIGIN`
- After first deploy run `npm run seed` and `npm run make-admin` in the service shell.

For Vercel, swap SQLite for Postgres (Neon/Supabase): only `server/db.js` and the queries in `routes.js` change.
