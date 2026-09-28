# Diabetes Expert System 🩺

A professional, full-stack web application designed to leverage an expert system for diabetes diagnosis, management recommendations, and clinical workflow tracking. Built with a modern **React (Vite+Tailwind)** frontend and a robust **Flask** backend, fortified by secure role-based access control (RBAC), and backed by a **Supabase PostgreSQL** database.

---

## Project Lineage and Independent Deployment

This application was originally developed collaboratively by the Git contributors **dev-vichea**, **Kiddd**, **Tisa7777**, and **nishthegreatest**. The original team repository is maintained separately at [dev-vichea/diabetes-expert-system-v2](https://github.com/dev-vichea/diabetes-expert-system-v2).

This repository is an independently maintained continuation for personal upgrades and deployment. It preserves the collaborative Git history, expert-system knowledge, source code, migrations, tests, documentation, and versioned project assets so the original contributors and development work remain visible.

The deployments are intentionally isolated:

- The original team repository, frontend, backend, database, domains, and deployment services remain unchanged.
- This repository connects only to its own GitHub repository and must use newly created frontend, backend, database, domains, OAuth configuration, and secrets.
- Commits pushed here do not deploy the original team application. Updates to the team repository do not deploy this copy unless they are deliberately reviewed and merged.
- Deployment credentials and provider-specific local project links are not committed. Use the checked-in `.env.example` files to configure each new environment.

Only the project lineage and application knowledge are shared; the live infrastructure and data stores are separate.

---

## 🎯 Key Features

### 🧠 Expert System Core
- **Forward Chaining Inference Engine**: Processes patient symptoms, lab results, and risk factors through a deterministic rule-engine.
- **Explainable AI (XAI) Output**: Every diagnosis includes a detailed, transparent explanation trace—from fact preparation to rule triggers, confidence calculation, and final recommendations.
- **Certainty Factor Integration**: Weighs clinical inputs dynamically to provide a confidence score for each diagnosis.

### 🛡 Security & Access Control (RBAC)
- **Role-Based Roles**: Customized access for `admin`, `doctor`, and `patient`.
- **JWT Authentication**: Secured session management with short-lived access tokens, refresh tokens, and active revocation tracking.
- **Admin Control Panel**: Comprehensive dashboard to manage users, configure roles, inspect permissions, and monitor system activity and audit logs.

### 🏥 Clinical Workflow
- **Patient Management**: Doctors can track patient histories, manage profiles, and review sequential lab results and symptoms.
- **Diagnosis Assessment**: Interactive, multi-step assessment forms enforcing stringent medical input validation.
- **Medical Review System**: Capabilities for clinical staff to flag urgent cases, add qualitative review notes, and annotate auto-generated diagnoses.

### 📚 Knowledge Base Management
- **Rule Editor**: A dedicated UI for medical professionals (or admins) to create, modify, and archive diagnostic rules without touching code.
- **Versioning & Auditing**: Every change to the rule set is snapshotted (`rule_versions`) and logged (`audit_logs`) to ensure compliance and traceability.

---

## 🛠 Tech Stack

**Frontend:**
- React 18 / Vite
- Tailwind CSS / shadcn/ui (Accessible, modern UI components)
- React Router (Guarded routing based on user claims)

**Backend:**
- Python 3 / Flask
- SQLAlchemy ORM / Alembic (Database Migrations)
- psycopg / PostgreSQL (Hosted via Supabase)
- Flask-JWT-Extended / Werkzeug (Auth & Security)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- A [Supabase](https://supabase.com) account & PostgreSQL instance (or local PostgreSQL)

### Independent demo quick start (Windows)

Create a new PostgreSQL database or Supabase project that is not shared with
the team deployment. Then run this command from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-demo.ps1
```

The launcher securely requests the new database URL, generates a new local
secret, creates ignored demo environment files, and starts both applications.
It refuses to overwrite a non-demo environment. Open http://127.0.0.1:5173
after startup.

See [DATABASE_SETUP.md](DATABASE_SETUP.md) to connect Supabase or a local
PostgreSQL database and view it in pgAdmin.

See [DEMO_MODE.md](DEMO_MODE.md) for the full database, local setup, cloud
deployment, demo-account, and isolation instructions.

### 1. Backend Setup (PostgreSQL)

1. **Navigate to the backend directory and install dependencies:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your `DATABASE_URL` to the full **Session Pooler URL from a new personal Supabase project** (ensure you use `postgresql+psycopg://...`). Example:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   FLASK_RUN_PORT=5001
   ```

3. **Initialize the Database:**
   With `DB_AUTO_CREATE=1` (the default in `.env.example`) the first
   `python run.py` creates the tables, records the migration version and
   seeds demo data, so no extra command is needed. To apply migrations
   manually instead:
   ```bash
   export FLASK_APP=run.py
   flask db upgrade
   ```
   Step-by-step Supabase, local PostgreSQL and pgAdmin instructions are in
   [DATABASE_SETUP.md](DATABASE_SETUP.md).

4. **Run the API Server:**
   ```bash
   python run.py
   ```
   *The backend will typically start on `http://127.0.0.1:5001`.*

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your running backend (e.g., `http://127.0.0.1:5001/api`).

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *The frontend will typically start on `http://localhost:5173`.*

---

## 🔑 Demo Accounts (If Seeded)

The default knowledge base is the expanded **v3** set (59 rules and 99 catalog
facts). It includes two-test confirmation, random glucose with classic
symptoms, pregnancy-specific fasting/1-hour/2-hour 75-g OGTT criteria,
discordant-result review, and near-threshold repeat-testing guidance. Set
`RULES_SEED_VERSION=v3` in `backend/.env`. For an already initialized database,
synchronize the rule set and fact catalog from the backend directory:

```bash
source .venv/bin/activate
flask --app run.py sync-knowledge-base --version v3
```

This archives rules from other bundled versions, inserts missing v3 rules and
fact definitions, and preserves custom rules, existing fact edits, users and
patient records. Existing inactive v3 rules stay inactive; archived v3 rules
are reactivated when switching back to v3. Derived facts appear in the catalog
but do not contribute independent symptom weights. The command is safe to
repeat. The `--version` option applies to that invocation; the environment
setting selects the version for future seeding. Restart the backend after
changing the environment setting.

If you enabled `SEED_DEMO_DATA=true` in your backend environment, the following accounts will be pre-provisioned:

| Role        | Email                  | Password     |
|-------------|------------------------|--------------|
| Superadmin  | superadmin@example.com | `superadmin123` |
| Admin       | admin@example.com      | `admin123`   |
| Doctor      | doctor@example.com     | `doctor123`  |
| Patient     | patient@example.com    | `patient123` |

---

## 🧪 Testing and Verification

**Backend Tests:**
```bash
cd backend
source .venv/bin/activate
pytest
```

**Frontend Build:**
```bash
cd frontend
npm run build
```

---

*This system is intended for research, demonstration, and clinical assistance prototyping. Always consult a certified healthcare professional for actual medical diagnosis and treatment.*
