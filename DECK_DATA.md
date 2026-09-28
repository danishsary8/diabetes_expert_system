# Deck data: Diabetes Expert System v2

Verified from the code on branch `feature/GoogleLogin` (2026-09-24). Use only these values on slides.

## Identity
- Name: Diabetes Expert System (repo `diabetes-expert-system-v2`, frontend v0.1.0)
- One-liner: A bilingual (English/Khmer) diabetes screening and clinical decision-support web app. It uses forward-chaining rules to turn symptoms, lab values and risk factors into an explained diagnosis, a suspected diabetes type and an urgency level, and routes urgent cases to doctors.
- Users: patients, doctors, nurses, clinic admins
- Region: Cambodia (Asia/Phnom_Penh time zone, full Khmer UI and PDFs, Asian BMI thresholds)

## Problem (framing — the code has no written problem statement)
- Patients: diabetes goes undetected without lab tests. The app screens from symptoms alone, flags emergencies (DKA, hypoglycemia) and explains results in Khmer.
- Clinics: no structured triage. The app gives urgent alerts, a review queue, standardized EN/KM reports and an audit trail.
- Stats in the code (general, not Cambodia-specific; source: in-app Diabetes Guide):
  - Type 2 ≈ 90–95% of cases; Type 1 ≈ 5–10%
  - Prediabetes is silent in up to 80% of people and often progresses within 3–5 years
  - Lifestyle change cuts progression risk by up to 58%
  - Gestational diabetes raises lifetime Type 2 risk by up to 50%

## Goals
1. Early screening and triage
2. Explainable decisions
3. Clinical workflow support

Not a replacement for doctors. Quote: "a screening and decision-support tool. It does NOT replace clinical diagnosis by a qualified doctor."

## Features
**Patient:**
- Sign-up, and Google sign-in
- Required health-profile setup
- Adaptive one-question-at-a-time interview (pregnancy follow-ups, DKA warnings)
- Result page: certainty, type, urgency, plain summary, education per fact, technical trace
- EN/KM PDF download and a printable report
- Submit to care team with a note
- History, Care Plan (checklist, routine, watchlist, prevention), personal dashboard
- Diabetes Guide (4 types, symptom library)
- Notifications, profile and avatar, language switcher

**Doctor/Nurse:**
- Patient registry with search and filters; register and edit patients
- Record symptoms and labs; run assessments for patients
- Clinical analytics dashboard
- Urgent triage alerts
- Doctor only: review queue (notes, urgent flag) and the knowledge base

**Admin:**
- User management and activation
- Role assignment and a roles/permissions matrix
- Audit logs, activity overview, system stats

**Knowledge base** (tabs: Overview, Rule Editor, Visual Graph, Sandbox, Facts):
- No-code rule editor; rules are versioned and audited
- React Flow logic graph
- Rule sandbox
- Facts catalog with EN/KM education text; doctors' fact weights change inference live

## Expert system
- Method: grouped forward chaining in 4 stages: Triage → Diagnosis → Classification → Recommendation
- Certainty: MYCIN certainty factors
  - Effective CF = rule CF × priority weight (high 1.0, medium 0.9, low 0.8)
  - Evidence for the same conclusion combines as CF = c + i·(1 − c)
- Rules: v1 = 96 (default), v2 = 31, v3 = 40 (adds IADPSG pregnancy rules)
- 65 facts; 15 diagnosis conclusions
- Cardinal facts: excessive thirst, frequent urination, excessive hunger, nocturia, unquenchable thirst
- Interview core symptoms: thirst, urination, hunger, weight loss, fatigue
- Urgency: Emergency > Urgent > Soon > Routine
- Type resolution (Type 1 / Type 2 / Gestational):
  - Rule votes plus clinical priors (age, BMI, onset speed, weight loss, ketosis signs, acanthosis, family history)
  - Gestational wins when the patient is pregnant
  - "Mixed features" only on a near-tie
  - Otherwise commits to the leading type
- Standards:
  - ADA: fasting ≥126, random/OGTT ≥200, HbA1c ≥6.5% (5.7–6.4% = prediabetes), hypoglycemia <70, ADA risk score
  - IADPSG: fasting ≥92, 2-hour OGTT ≥153
  - Asian BMI: 23 / 27.5
  - Sources: ADA 2025/26, WHO 2019, IDF 2024

## Tech stack
- Frontend: React 18.3.1, Vite 6.4.3, Tailwind 3.4.17, Radix UI, React Router 6.30.6, Recharts 3.8.0, React Flow 12.10.2, axios 1.20.0
- Backend: Python 3.11, Flask 3.1.0, SQLAlchemy 2.0.54, Alembic 1.20.0, Flask-Limiter 3.12, gunicorn 23.0.0
- Database: PostgreSQL 16 (Supabase), with automatic SQLite fallback
- Auth: JWT (PyJWT 2.10.1) with access, refresh and revocation; Google Sign-In (google-auth 2.58.0)
- PDF: English via ReportLab 4.4.10; Khmer via WeasyPrint 70.0 with Khmer fonts
- Deploy: Vercel, Railway, Docker (nginx 1.27, node 20, python 3.12, postgres 16)

## Numbers
- 80 API routes
- 20 database tables
- 11 migrations
- 19 permissions, 5 roles
- 96 / 31 / 40 rules (v1 / v2 / v3)
- 65 facts, 15 conclusions
- 2,345 UI translation keys per language (EN = KM parity)
- Tests: 133 of 134 passing

## Unique points
- Full explanation trace for every result
- MYCIN certainty factors combined with clinical priors
- The type result never says "Undetermined"
- The result can't contradict itself: when labs are normal but symptoms are present, it adds a note
- Knowledge base editable by doctors without code
- Complete Khmer support, including Khmer PDFs
- Urgent cases automatically alert clinicians
- Permission-based access control, audit log, rate limiting

## Future (not in code — team decision)
- Make the v3 rule set the default (it already exists)

## Team
Git authors (replace with real names): dev-vichea, Kiddd, Tisa7777, nishthegreatest
