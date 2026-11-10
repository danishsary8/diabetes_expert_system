# Connecting the Frontend to the Backend

The React frontend (Vite) talks to the Flask backend over HTTP. Two settings
control the connection:

```text
 Browser ──► React frontend ──VITE_API_BASE_URL──► Flask backend ──DATABASE_URL──► PostgreSQL
            (port 5173)                           (port 5001)
                                  ▲
                                  └── backend allows the frontend's address via CORS_ORIGINS
```

| Setting | File | What it does |
|---|---|---|
| `VITE_API_BASE_URL` | `frontend/.env` | Where the frontend sends API requests. Must end in `/api`. |
| `CORS_ORIGINS` | `backend/.env` | Which frontend addresses the backend accepts requests from. |

Set up the database first: see [DATABASE_SETUP.md](DATABASE_SETUP.md).

---

## 1. Run both locally

### Step 1: Configure the frontend

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

The default `frontend/.env` already points to the local backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:5001/api
```

`backend/.env.example` already allows `http://localhost:5173` and
`http://127.0.0.1:5173` in `CORS_ORIGINS`, so nothing else is needed locally.

### Step 2: Start both servers (two terminals)

```bash
# Terminal 1 – backend
cd backend
source .venv/bin/activate      # Windows: .venv\Scripts\activate
python run.py                  # http://127.0.0.1:5001

# Terminal 2 – frontend
cd frontend
npm run dev                    # http://localhost:5173
```

Shortcuts that start both at once:

- macOS / Linux: `./run.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File .\run-demo.ps1`

### Step 3: Check the connection

1. Open <http://localhost:5173>.
2. Log in with `doctor@example.com` / `doctor123`.
3. You should land on the dashboard with data loaded.

To see the requests yourself, open browser DevTools (F12) → **Network** tab
→ filter by `api`. You should see `POST /api/auth/login` and
`GET /api/dashboard/clinical` with status **200**.

> **Alternative: Vite proxy.** Set `VITE_API_BASE_URL=/api` and the Vite dev
> server forwards `/api` requests to `http://127.0.0.1:5001` (configured in
> `frontend/vite.config.js`). The browser then sees only one address, so CORS
> never comes into play.

---

## 2. Deploy (backend on Railway, frontend on Vercel)

### Step 1: Deploy the backend first

1. Railway → **New Project → Deploy from GitHub repo** → pick this repository.
2. Open the service → **Settings → Source → Root Directory** = `backend`.
   Railway then uses `backend/railway.json`, which builds `backend/Dockerfile`
   (gunicorn, PDF libraries and Khmer fonts included).
3. **Variables** tab → add:

```env
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">
FLASK_DEBUG=false
DEMO_MODE=true
REQUIRE_POSTGRES=1
DB_FALLBACK_ENABLED=0
DB_AUTO_CREATE=1
SEED_DEMO_DATA=1
RULES_SEED_VERSION=v3
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3
CORS_ORIGINS=https://your-frontend.vercel.app
```

Use Supabase's **Transaction pooler (port 6543)** for the deployed backend:
gunicorn runs 4 workers, which can exceed the free plan's Session pooler
(port 5432) client limit. The backend detects port 6543 and turns off
prepared statements automatically. Do not set `PORT`; Railway provides it.

4. **Settings → Networking → Generate Domain**, then open
   `https://<backend-domain>/api/health`. It must return `"status": "ok"`
   and `"database": "postgresql"`.

### Step 2: Deploy the frontend

Create a Vercel project from this repository with **Root Directory** set to
`frontend`. Add in Vercel → **Settings → Environment Variables**:

```env
VITE_API_BASE_URL=https://<backend-domain>/api
VITE_DEMO_MODE=true
VITE_DEMO_LABEL=Independent Demo
```

Then **Redeploy**. `VITE_*` values are baked into the JavaScript at build
time, so changing them always needs a new deployment.

### Step 3: Allow the frontend in the backend

Set `CORS_ORIGINS` on Railway to your exact Vercel address (no trailing
slash). Any `https://*.vercel.app` address is already allowed by default; a
**custom domain** must be listed explicitly. Separate several with commas:

```env
CORS_ORIGINS=https://your-frontend.vercel.app,https://www.your-domain.com
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Cannot connect to the backend at http://127.0.0.1:5001/api" | Backend not running, or wrong URL | Start `python run.py`; check `VITE_API_BASE_URL` |
| DevTools shows `blocked by CORS policy` | Frontend address not in `CORS_ORIGINS` | Add the exact origin (scheme + host + port) and restart the backend |
| Changed `frontend/.env` but nothing happens | Vite reads `.env` only at startup | Stop and re-run `npm run dev` (redeploy on Vercel) |
| Deployed site calls `127.0.0.1` | `VITE_API_BASE_URL` not set in Vercel | Add it and redeploy |
| `Mixed Content` error in the browser | HTTPS frontend calling an `http://` backend | Use the backend's `https://` URL |
| Requests time out on first use | Free hosting was asleep, or the database is paused | Wait and retry; restore a paused Supabase project |
| 404 when refreshing a page on Vercel | SPA routing | Already handled by `frontend/vercel.json`; make sure Root Directory is `frontend` |
