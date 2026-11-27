<div align="center">

<img src="portfolio/cover/banner-v2.jpg" alt="Diabetes Expert System on a laptop and a phone, with a screening result and its reasons" width="100%" />

# Diabetes Expert System

**Early diabetes screening that explains its answer, in English and ខ្មែរ.**

Patients answer a guided health check, a rule-based expert system shows its result *and the reasons behind it*, and doctors review it and send a care plan.

[**Live demo**](https://diabetes-expert-system-chi.vercel.app/) · [Screens](#screens) · [Getting started](#getting-started) · [Demo accounts](#demo-accounts)

![React](https://img.shields.io/badge/React_18-20232a?logo=react&logoColor=61dafb)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?logo=tailwindcss&logoColor=38bdf8)
![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_+_RBAC-0b5a55)

🏆 **Award winner · AI Expert System and Innovation 2026**

</div>

---

## At a glance

| 59 | 99 | 219 | 2,695 |
| :---: | :---: | :---: | :---: |
| clinical rules | clinical facts | backend tests | strings, each in English and Khmer |

- **Explainable results.** Every screening shows its confidence and the evidence that led to it: which facts were used, which rules fired, and what to do next.
- **Three apps in one.** A patient app (health check, results, care plan, guide, Dr. Bot assistant), a doctor workspace (dashboard, review queue, patient records, rule editor) and an admin console (users, roles, permissions).
- **Two languages everywhere.** Every screen switches between English and Khmer.
- **Phone and laptop.** Every page is designed for both. On laptops, each health-check question fits on one screen.

---

## Screens

All screenshots come from the running app with its built-in demo data. Each screen is shown on a laptop and a phone.

### Patient

<table>
  <tr>
    <td width="74%"><img src="portfolio/screens/patient-home.webp" alt="Patient home with today's fasting glucose on a colour band" /></td>
    <td width="26%"><img src="portfolio/screens/m-patient-home.webp" alt="Patient home on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Home</b>: today's fasting glucose on a colour band, so patients see at a glance whether they're on track.</td></tr>
  <tr>
    <td><img src="portfolio/screens/result.webp" alt="Assessment report showing a prediabetes risk pattern with 94% confidence" /></td>
    <td><img src="portfolio/screens/m-result.webp" alt="Assessment report on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Result with reasons</b>: a plain-language result, how confident the system is, and the next steps.</td></tr>
  <tr>
    <td><img src="portfolio/screens/care-plan.webp" alt="Care plan with today's goals, medication and appointments" /></td>
    <td><img src="portfolio/screens/m-care-plan.webp" alt="Care plan on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Care plan</b>: today's goals, medication times and appointments, built around the latest result.</td></tr>
  <tr>
    <td><img src="portfolio/screens/assistant.webp" alt="Dr. Bot assistant answering which symptoms to watch for" /></td>
    <td><img src="portfolio/screens/m-assistant.webp" alt="Dr. Bot assistant on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Dr. Bot</b>: a friendly assistant that answers common diabetes questions in English and Khmer.</td></tr>
  <tr>
    <td><img src="portfolio/screens/patient-home-km.webp" alt="Patient home in Khmer" /></td>
    <td><img src="portfolio/screens/m-patient-home-km.webp" alt="Patient home in Khmer on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>In Khmer</b>: every screen switches language with one tap.</td></tr>
</table>

### Doctor

<table>
  <tr>
    <td width="74%"><img src="portfolio/screens/doctor-home.webp" alt="Doctor dashboard with urgent patients, review queue and care plans" /></td>
    <td width="26%"><img src="portfolio/screens/m-doctor-home.webp" alt="Doctor dashboard on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Dashboard</b>: urgent patients, cases waiting for review and care plans in one view.</td></tr>
  <tr>
    <td><img src="portfolio/screens/assessment.webp" alt="Guided assessment question about thirst, with an illustration" /></td>
    <td><img src="portfolio/screens/m-assessment.webp" alt="Guided assessment on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Guided assessment</b>: one question at a time, with pictures. Answers already on file are filled in.</td></tr>
  <tr>
    <td><img src="portfolio/screens/review.webp" alt="Review queue with an urgent case and the doctor's note" /></td>
    <td><img src="portfolio/screens/m-review.webp" alt="Review queue on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Review queue</b>: check the system's result, add a note, and flag urgent cases.</td></tr>
  <tr>
    <td><img src="portfolio/screens/rule-editor.webp" alt="Rule editor with IF, OR and AND conditions and a certainty factor" /></td>
    <td><img src="portfolio/screens/m-rule-editor.webp" alt="Rule editor on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Rule editor</b>: doctors write rules as IF / AND / OR conditions with a certainty factor, no code needed.</td></tr>
</table>

### Admin

<table>
  <tr>
    <td width="74%"><img src="portfolio/screens/admin-roles.webp" alt="Roles and permissions matrix" /></td>
    <td width="26%"><img src="portfolio/screens/m-admin-roles.webp" alt="Roles and permissions on a phone" /></td>
  </tr>
  <tr><td colspan="2"><b>Roles & permissions</b>: five built-in roles, plus custom roles built from 19 permissions.</td></tr>
</table>

More screens (patient record, knowledge base, diabetes guide, landing page) are in [`portfolio/screens`](portfolio/screens).

---

## Features

**Expert system core**
- Forward-chaining inference over symptoms, lab results and risk factors.
- Certainty factors weigh each input into a confidence score.
- A transparent explanation trace for every result: facts prepared, rules triggered, confidence calculated, recommendations made.

**Clinical workflow**
- A guided, multi-step health check with medical input validation. Patients can answer for themselves or someone else.
- Patient records with visits, symptoms, lab results and every past result.
- A review queue for doctors to add notes, flag urgent cases and sign off results.
- Treatment and care plans with goals, medication and appointments.

**Knowledge base**
- A rule editor for clinicians to create, edit and archive rules without touching code.
- Every rule change is versioned (`rule_versions`) and logged (`audit_logs`).
- The default v3 set covers two-test confirmation, random glucose with classic symptoms, pregnancy OGTT criteria, discordant results and repeat-testing guidance.

**Security**
- JWT access and refresh tokens with revocation.
- Role-based access with five built-in roles (super admin, admin, doctor, nurse, patient) and custom roles.
- Google sign-in, plus an admin console for users, roles, permissions and audit logs.

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, React Router, Recharts |
| Backend | Python 3, Flask, SQLAlchemy, Alembic |
| Database | PostgreSQL (Supabase or local) |
| Auth | JWT, role-based access control, Google sign-in |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Getting started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A PostgreSQL database: a new [Supabase](https://supabase.com) project or a local PostgreSQL

### Quick start (Windows)

Create a new PostgreSQL database (not shared with the team deployment), then run from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-demo.ps1
```

The launcher asks for the database URL, generates a local secret, creates the demo environment files and starts both apps. It refuses to overwrite a non-demo environment. Open http://127.0.0.1:5173 when it's ready.

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

In `.env`, set `DATABASE_URL` to your database. For Supabase, use the **Session Pooler** URL with the `postgresql+psycopg://` scheme:

```env
DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
FLASK_RUN_PORT=5001
```

Start the API (with `DB_AUTO_CREATE=1`, the default, the first run creates the tables and seeds demo data):

```bash
python run.py
```

The API runs at `http://127.0.0.1:5001`. To apply migrations by hand instead, run `flask --app run.py db upgrade`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_BASE_URL=http://127.0.0.1:5001/api
npm run dev
```

The app runs at `http://localhost:5173`.

More detail: [DATABASE_SETUP.md](DATABASE_SETUP.md) (Supabase, local PostgreSQL, pgAdmin) · [FRONTEND_SETUP.md](FRONTEND_SETUP.md) (connecting and deploying both apps) · [DEMO_MODE.md](DEMO_MODE.md) (demo accounts, cloud deployment, isolation).

### Updating the knowledge base

The default rule set is **v3** (59 rules, 99 facts), selected with `RULES_SEED_VERSION=v3` in `backend/.env`. To sync an existing database to v3:

```bash
cd backend && source .venv/bin/activate
flask --app run.py sync-knowledge-base --version v3
```

This archives rules from other bundled versions and adds missing v3 rules and facts. It keeps custom rules, fact edits, users and patient records, and it is safe to run more than once. Restart the backend after changing the environment setting.

---

## Demo accounts

When `SEED_DEMO_DATA=true`, these accounts are created:

| Role | Email | Password |
| --- | --- | --- |
| Super admin | superadmin@example.com | `superadmin123` |
| Admin | admin@example.com | `admin123` |
| Doctor | doctor@example.com | `doctor123` |
| Nurse | nurse@example.com | `nurse123` |
| Patient | patient@example.com | `patient123` |

---

## Testing

```bash
# Backend (219 tests)
cd backend && source .venv/bin/activate && pytest

# Frontend tests and production build
cd frontend && npm test && npm run build
```

To run the backend suite against a real PostgreSQL, point `TEST_DATABASE_URL` at a **throwaway** database (its `public` schema is dropped and recreated for every test):

```bash
TEST_DATABASE_URL=postgresql://user:pass@127.0.0.1:6543/test_db pytest tests
```

---

## Team and project history

Built as a team project by **dev-vichea**, **Kiddd**, **Tisa7777** and **nishthegreatest**, supervised by **Prof. Sek Sokcheat**. The original team repository is [dev-vichea/diabetes-expert-system-v2](https://github.com/dev-vichea/diabetes-expert-system-v2).

This repository is an independently maintained continuation for personal upgrades and deployment. It keeps the shared Git history, knowledge base, code, migrations, tests and documentation, but its live infrastructure is separate:

- The team's repository, frontend, backend, database, domains and services are unchanged.
- This copy uses its own frontend, backend, database, domains, OAuth settings and secrets.
- Pushing here never deploys the team app, and team updates reach this copy only when deliberately reviewed and merged.
- Credentials and provider links are never committed. Use the `.env.example` files to configure each environment.

---

<sub>This system is for research, demonstration and clinical-assistance prototyping. It does not replace a qualified healthcare professional's diagnosis or treatment. All people and records in the screenshots are synthetic demo data.</sub>
