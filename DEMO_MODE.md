# Independent Demo Setup

This repository is the independently maintained demo/upgrade version of the Diabetes Expert System. It preserves the original collaborative source history and clinical knowledge, but its live infrastructure must remain separate from the team deployment.

## What the demo profile changes

- Enables an explicit backend and frontend demo mode.
- Displays an `Independent Demo` notice in the UI.
- Uses the existing synthetic seed users, patients, rule base, and fact catalog.
- Requires a newly created PostgreSQL-compatible database.
- Generates a new local `SECRET_KEY` instead of reusing a team secret.
- Disables database fallback so a failed connection cannot silently switch to another database.
- Keeps all real environment files and local cloud-provider links out of Git.
- Reports `demo_mode: true` from `/health` and `/api/health`.

No clinical rule, fact, migration, test, or versioned project asset was removed for demo mode.

## Implementation record

The independent demo profile was added on 2026-09-28 with these repository changes:

- `backend/app/config.py` reads the explicit `DEMO_MODE` flag.
- `backend/app/__init__.py` exposes the flag through both health endpoints.
- `frontend/src/components/DemoModeBanner.jsx` labels the running application as an independent demo using synthetic data.
- `frontend/src/pages/LoginPage.jsx` prefills the doctor account only when demo mode is enabled and explains which data environment it uses.
- `backend/.env.example`, `frontend/.env.example`, and the root `.env.example` contain safe personal-demo templates without real credentials.
- `run-demo.ps1` validates a new PostgreSQL URL, generates a secret, refuses unsafe environment reuse, and uses the isolated `.venv-demo` environment.
- Docker Compose containers and volumes use `personal_demo` names and the v3 seed, avoiding collision with team-era local containers.
- `.gitignore` excludes all real environment files, cloud CLI links, and demo virtual-environment files.
- `README.md` links to this guide and no longer recommends SQLite for this independent demo.

Verification performed after the change:

- Frontend production build completed successfully with demo mode enabled.
- Backend API smoke suite completed successfully.
- PowerShell launcher syntax parsed successfully.

## Infrastructure separation

Use new resources owned by the personal project:

1. Personal GitHub repository: `danishsary8/diabetes_expert_system`
2. New PostgreSQL database or new Supabase project
3. New Railway/backend service
4. New Vercel/frontend project
5. New domains or subdomains
6. New application secret and, if used, a separate OAuth configuration

Never paste the team database URL into this repository's environment. Never connect the old team Railway or Vercel project to this repository.

## Create the database

### Supabase

Create a new Supabase project. In its connection settings, copy the **Session Pooler** URL and change its scheme to `postgresql+psycopg://` if necessary:

```text
postgresql+psycopg://postgres.PROJECT_REF:ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

URL-encode special characters in the password. Do not put the real URL in any committed file.

### Other PostgreSQL providers

Railway Postgres, Neon, Render Postgres, or a local PostgreSQL server also work. Accepted schemes are:

```text
postgres://
postgresql://
postgresql+psycopg://
```

## Run locally on Windows

From the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-demo.ps1
```

On the first run, the script securely prompts for the new database URL and asks you to type `NEW`. It then creates ignored `backend/.env` and `frontend/.env` files, generates a fresh secret, and starts the backend and frontend in separate terminals.

The launcher uses an isolated `backend/.venv-demo` Python environment, so it does not reuse or modify a virtual environment from the team project.

To configure without starting services:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-demo.ps1 -SetupOnly
```

To reinstall dependencies:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-demo.ps1 -Install
```

The `Bypass` setting applies only to this launcher process; it does not change the machine-wide PowerShell execution policy.

The launcher refuses to overwrite an environment that is not marked as this independent demo.

## Demo accounts

The first backend startup creates the schema and seeds synthetic data when the new database is empty.

| Role | Email | Password |
|---|---|---|
| Superadmin | `superadmin@example.com` | `superadmin123` |
| Admin | `admin@example.com` | `admin123` |
| Doctor | `doctor@example.com` | `doctor123` |
| Nurse | `nurse@example.com` | `nurse123` |
| Patient | `patient@example.com` | `patient123` |

These are public demo credentials. Do not use this seed configuration for real patient data or a production clinical system.

## Deploy a new backend

Create a new backend service from the personal GitHub repository. Configure these variables in that new service:

```env
DEMO_MODE=true
FLASK_DEBUG=false
SECRET_KEY=<new-random-secret>
DATABASE_URL=<new-personal-postgresql-url>
DB_AUTO_CREATE=true
SEED_DEMO_DATA=true
RULES_SEED_VERSION=v3
DB_FALLBACK_ENABLED=false
CORS_ORIGINS=https://<new-frontend-domain>
```

Generate a secret locally:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

After deployment, verify:

```text
https://<new-backend-domain>/api/health
```

The response should contain `status: "ok"` and `demo_mode: true`.

## Deploy a new frontend

Create a new frontend project from the personal GitHub repository and configure:

```env
VITE_API_BASE_URL=https://<new-backend-domain>/api
VITE_API_TIMEOUT_MS=20000
VITE_DEMO_MODE=true
VITE_DEMO_LABEL=Independent Demo
```

Google authentication is optional. If enabled, use an OAuth client whose authorized origins include only the new frontend domains.

## Safety boundary

Changes in this repository affect only services explicitly connected to `danishsary8/diabetes_expert_system`. The team deployment remains independent as long as its services stay connected to the team repository and its own database. Git history attribution is shared; deployment credentials, databases, services, and domains are not.
