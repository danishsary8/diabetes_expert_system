# Database Setup: Supabase, PostgreSQL and pgAdmin

This guide connects the Flask backend to a PostgreSQL database and lets you
browse that database in pgAdmin.

## How the pieces fit together

```text
 Flask backend  ──DATABASE_URL──►  PostgreSQL database  ◄──  pgAdmin (GUI viewer)
                                   (local OR Supabase)
```

- **PostgreSQL** is the database engine.
- **Supabase** is a cloud service that hosts a PostgreSQL database for you.
  A Supabase database *is* a PostgreSQL database.
- **pgAdmin** is only a viewer/editor. It does not store data itself; it
  connects to a PostgreSQL server (local or Supabase) so you can see tables,
  run SQL, and inspect rows.

The backend uses exactly **one** database: whatever `DATABASE_URL` in
`backend/.env` points to. Pick one of the two options below.

| | Option A: Local PostgreSQL | Option B: Supabase |
|---|---|---|
| Best for | Offline development, learning SQL | Sharing, deploying (Railway/Vercel) |
| Internet needed | No | Yes |
| Cost | Free | Free tier |

---

## Step 1: Install the backend

```bash
cd backend
python -m venv .venv
# Windows:      .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
```

Generate a secret key and paste it into `SECRET_KEY=` in `backend/.env`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Step 2 (Option A): Local PostgreSQL + pgAdmin

### 2A.1 Install PostgreSQL and pgAdmin

- **Windows / macOS:** download the installer from
  <https://www.postgresql.org/download/>. It installs PostgreSQL **and
  pgAdmin** together. Remember the password you choose for the `postgres`
  user.
- **Docker (any OS):** from the repository root run

  ```bash
  docker compose up -d db                        # PostgreSQL on port 5432
  docker compose --profile tools up -d pgadmin   # pgAdmin on http://localhost:5050
  ```

  The Docker pgAdmin already has the "Diabetes Demo (Docker)" server
  registered; the password is `POSTGRES_PASSWORD` from the root `.env`
  (default `postgres`).

### 2A.2 Create the database in pgAdmin

1. Open pgAdmin and expand **Servers → PostgreSQL** (enter your password).
2. Right-click **Databases → Create → Database…**
3. Name it `diabetes_demo` and click **Save**.

### 2A.3 Point the backend at it

In `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@127.0.0.1:5432/diabetes_demo
```

Continue with **Step 3**.

---

## Step 2 (Option B): Supabase

### 2B.1 Create the project

1. Sign in at <https://supabase.com> → **New project**.
2. Choose a name, a region close to you, and a **database password**.
   Save this password; you need it below. (If you lose it: **Project
   Settings → Database → Reset database password**.)
3. Wait until the project finishes provisioning.

### 2B.2 Copy the connection string

1. Click **Connect** at the top of the project dashboard.
2. Choose the **Session pooler** connection string (port **5432**). It looks
   like:

   ```text
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

   Use the **Session pooler**, not "Direct connection". The direct host
   (`db.<ref>.supabase.co`) is IPv6-only on the free plan and fails on many
   home and university networks.

### 2B.3 Put it in `backend/.env`

1. Replace `[YOUR-PASSWORD]` with your database password (no brackets).
2. If the password contains special characters such as `@ # / : ? %`,
   URL-encode it first:

   ```bash
   python -c "from urllib.parse import quote; print(quote('p@ss#word', safe=''))"
   # prints: p%40ss%23word
   ```

3. Save it. Both `postgresql://` and `postgresql+psycopg://` work; the
   backend converts the scheme automatically.

   ```env
   DATABASE_URL=postgresql+psycopg://postgres.abcdefghijklmnop:p%40ss%23word@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   DB_POOL_SIZE=2
   DB_MAX_OVERFLOW=3
   ```

   The small pool keeps you under the free plan's connection limit.

> **Transaction pooler (port 6543)** also works. The backend detects port
> 6543 and turns off prepared statements automatically, which that pooler
> requires.

### 2B.4 Test the connection

From the repository root:

```bash
python test_supabase_connection.py
# press Enter to use backend/.env
```

You should see `✅ Connection successful!`.

### 2B.5 View the Supabase database in pgAdmin

1. In pgAdmin: right-click **Servers → Register → Server…**
2. **General** tab: Name = `Supabase – Diabetes`.
3. **Connection** tab, copying values from the Session pooler string:

   | Field | Value |
   |---|---|
   | Host name/address | `aws-0-ap-southeast-1.pooler.supabase.com` (yours) |
   | Port | `5432` |
   | Maintenance database | `postgres` |
   | Username | `postgres.abcdefghijklmnop` (**includes** the project ref) |
   | Password | your database password (plain, **not** URL-encoded) |

4. **Parameters** tab: set **SSL mode** to `require`.
5. **Save**. Your tables appear under
   **Databases → postgres → Schemas → public → Tables** after Step 3.

You can see the same tables in Supabase under **Table Editor**.

---

## Step 3: Start the backend

```bash
cd backend
python run.py
```

On the first start against an empty database the backend automatically:

1. creates all tables (`DB_AUTO_CREATE=1`),
2. marks the schema as fully migrated, so `flask db upgrade` stays safe to
   run later,
3. seeds the rule base, fact catalog and demo accounts (`SEED_DEMO_DATA=1`).

Check it works:

```bash
curl http://127.0.0.1:5001/api/health
# {"data": {"demo_mode": true, "status": "ok"}, "success": true}

curl -X POST http://127.0.0.1:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"doctor123"}'
```

In pgAdmin, refresh **Tables** (right-click → Refresh). You should see 20
tables such as `users`, `patients`, `rules` and `facts`, plus
`alembic_version`. Try it in the Query Tool:

```sql
SELECT email FROM users;
SELECT COUNT(*) FROM rules;   -- 59 with the v3 rule set
```

Windows users can do Steps 1–3 in one go with
`powershell -ExecutionPolicy Bypass -File .\run-demo.ps1` (see
[DEMO_MODE.md](DEMO_MODE.md)).

---

## Troubleshooting

| Error message | Cause | Fix |
|---|---|---|
| `password authentication failed` | Wrong password, or Supabase username missing `.projectref` | Username must be `postgres.<ref>` for the pooler; reset the password in Supabase if unsure |
| `could not translate host name` / `Network is unreachable` | Using the IPv6-only direct host | Use the **Session pooler** string |
| `invalid literal for int()` / strange parse errors | Special characters in the password | URL-encode the password (Step 2B.3) |
| `Max client connections reached` / `max clients reached in session mode` | Pool too large for the free plan | Set `DB_POOL_SIZE=2` and `DB_MAX_OVERFLOW=3` |
| `prepared statement "_pg3_0" already exists` | Transaction pooler with prepared statements | Use port 6543 (auto-detected) or set `DB_DISABLE_PREPARED_STATEMENTS=1` |
| `relation "..." already exists` on `flask db upgrade` | Tables were created by an older version of the app without a migration record | Run `flask --app run.py db stamp head` once, then `flask db upgrade` works |
| `connection refused` on `127.0.0.1:5432` | Local PostgreSQL not running | Start the PostgreSQL service, or `docker compose up -d db` |
| App shows data that is missing in Supabase | Backend is using another database (local PostgreSQL, or a SQLite file because `DATABASE_URL` was not read) | Open `http://127.0.0.1:5001/api/health`: `database_host` must be your `*.pooler.supabase.com` host. Fix `DATABASE_URL` in `backend/.env`, set `DB_FALLBACK_ENABLED=0`, restart |
| Supabase project "paused" | Free projects pause after inactivity | Click **Restore** in the Supabase dashboard |

Never commit `backend/.env`; it contains your database password. It is already
listed in `.gitignore`.
