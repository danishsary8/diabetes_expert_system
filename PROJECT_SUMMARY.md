# Project summary: Diabetes Expert System v2

Everything below comes from reading the code on branch `feature/GoogleLogin` and from running the backend test suite (2026-09-24).

## 1. Project overview
- **What it does:** It screens people for diabetes and supports clinical decisions. It uses rules and forward chaining. Inputs are symptoms, lab values, risk factors and demographics. Outputs are a diagnosis headline with a certainty score, the suspected type (Type 1, Type 2 or Gestational), an urgency level, recommendations and a full explanation trace.
- **Who it's for:** Patients, who can self-assess, and clinic staff (doctors, nurses and admins). The UI and the PDF reports are in English and **Khmer**, so it's aimed at a Cambodian clinic.
- **Problem it solves:** Early detection and triage of diabetes where lab tests may be missing. It gives symptom-only screening, type discrimination and emergency flags (DKA, hypoglycemia), and sends urgent cases into a doctor review queue.
- The v3 rule seed describes the system as *"a screening and decision-support tool. It does NOT replace clinical diagnosis."*

## 2. Tech stack
| Layer | What's used |
|---|---|
| Frontend | React 18 + Vite 6, React Router 6, Tailwind 3 + `tailwindcss-animate`, Radix UI / shadcn-style components (`components.json`), `lucide-react`, `recharts` (charts), `@xyflow/react` (rule graph), `sonner` (toasts), `cmdk`, axios, `@react-oauth/google` |
| Backend | Python Flask 3.1 app factory (`backend/app/__init__.py`), Flask-SQLAlchemy, Flask-Migrate (Alembic), Flask-CORS, Flask-Limiter, gunicorn |
| Database | PostgreSQL through `psycopg` 3 in production. SQLite for dev, with an automatic fallback when Postgres is unreachable (`_resolve_startup_database`). 11 Alembic migrations in `backend/migrations/versions/` |
| Auth | JWT (PyJWT, HS256): access token 3600 s, refresh token 604800 s. Token revocation table. Passwords hashed with werkzeug. **Google Sign-In** (`google.oauth2.id_token.verify_oauth2_token`) |
| PDF | ReportLab for English. **WeasyPrint** for Khmer, using `templates/report_khmer.html` and bundled Khmer fonts (Battambang, Kantumruy Pro, Noto Sans Khmer) |
| External services | Only Google OAuth. Deploy config exists for Vercel (`vercel.json`), Railway (`railway.json`/`.toml`), Docker Compose (Postgres 16) and Procfile. A Postman collection is in `postman/` |

## 3. Features
**Patient**
- Self-registration and Google login. Google login auto-creates a patient account; staff accounts can't be linked through Google.
- Mandatory health-profile setup (`ProfileGate`, `ProfileSetupPage`).
- Adaptive assessment interview (`InterviewFlow.jsx`, node graph in `interview-flow.js`). Includes pregnancy follow-ups and T1D/DKA warning banners.
- Result page with education per fact (`ConditionEducationPanel`), a plain summary, and technical details.
- History (`/my-results`), a Care Plan page (checklist, routine, watchlist, prevention), a patient dashboard, a diabetes guide, and EN/KM PDF download.
- "Submit to care team" and notifications.

**Doctor / nurse**
- Patient registry, patient history, and adding symptoms and lab results.
- Clinical dashboard: throughput trend, risk classification, urgent count, rule analytics (`dashboard_service.py`).
- Review queue (`ReviewPage`): add a review note and set or clear the urgent flag, which notifies the patient.
- Urgent triage alerts go to every doctor and nurse.

**Knowledge base** (doctor/admin, `RulesPage` tabs: Overview, Rule Editor, Visual Graph, Sandbox, Facts)
- Rule CRUD with archiving, version snapshots (`RuleVersion`) and a per-rule audit log.
- Fact catalog CRUD (`FactCatalog.jsx`). Doctors edit fact weight, type indication and the cardinal/emergency flags, and those edits change inference at runtime.
- Visual logic map built with React Flow.
- Client-side rule sandbox (`RuleSimulator.jsx`).

**Admin**
- User CRUD, activating/deactivating users, a role and permission matrix editor, audit logs, activity overview and system stats.

**Complete vs incomplete:** see section 10.

## 4. Architecture
- **Communication:** a REST JSON API under `/api/*`. The axios client is in `frontend/src/api/client.js`. It sends a Bearer token from `localStorage` and refreshes it automatically on 401 with a single shared refresh promise. Every response goes through `success_response` (`utils/api_response.py`).
- **Backend layering:** `routes/` (Blueprints) → `services/` (business logic) → `repositories/` (data access) → `models/entities.py`. Services are built once in `dependencies.py::init_dependencies` and stored in `app.extensions["services"]`, which is a simple form of dependency injection.
- **Expert system:** a separate package, `app/expert_system/`, that doesn't depend on Flask.
- **Frontend layout:** `pages/`, `components/{assessment,dashboard,knowledge-base,admin,layout,guards,ui}`, `contexts/` (Auth, Language, Notification), `locales/`, and a `lib/lazyWithRetry.js` helper that recovers from stale chunks after a deploy.
- **Patterns:** a Repository + Service layer, permission-based RBAC through the `@require_auth(permissions=..., permission_mode="any"|"all")` decorator, and the same RBAC mirrored in the frontend `RoleGuard`.
- **Other backend features:**
  - Security headers.
  - Rate limits: login 10/min, register 5/min, refresh 20/min.
  - CLI commands `seed-db` and `cleanup-tokens`.
  - Missing columns added at startup (`_ensure_user_profile_columns`).

## 5. Expert system logic
The main pipeline is `inference_engine.run_inference`, called from `DiagnosisService.evaluate`.

1. **Fact preparation** (`fact_preparation.prepare_facts` → `fact_normalizer`): normalises aliases and derives new facts.
   - BMI and `is_obese` (BMI ≥ 30).
   - Hyperglycemia: fasting ≥ 126, random ≥ 200, OGTT ≥ 200, or HbA1c ≥ 6.5.
   - Hypoglycemia below 70.
   - Asian BMI thresholds: 23 and 27.5.
   - Metabolic syndrome, neuropathy cluster and type-discrimination patterns.
   - An **ADA risk score** (`_derive_ada_risk_score`). A score of 5 or more sets `high_ada_risk` and `type2_risk_increased`.
2. **Rule loading** (`RuleLoader`): turns the database rules (`Rule`, `RuleCondition`, `RuleAction`) into specs.
3. **Grouped forward chaining** (`GroupedForwardChainer`): runs rules in stages, in the order `triage → diagnosis → classification → recommendation`. Inside each stage, `ForwardChainer` keeps iterating until no new rule fires.
   - Condition operators: `== != > < >= <= in contains`, joined left-to-right with `and`/`or` (`condition_evaluator.py`).
   - Action types: `diagnosis_conclusion`, `assert_fact`, `recommendation`, `urgent_flag`.
4. **Certainty factors** (`confidence.py`):
   - Effective CF = rule CF × priority weight (high 1.0, medium 0.9, low 0.8).
   - When several rules support the same conclusion, their CFs combine MYCIN-style: `c + i·(1−c)`.
5. **Headline resolution:** a result below 0.3 becomes "No strong diabetes indication". If labs are normal but symptoms point to diabetes, the result says so with a context note instead of contradicting itself.
6. **Type resolution** (`_resolve_suspected_type`): rule votes are combined with clinical priors (`_type_priors`, capped at 0.45) from age, BMI, rapid onset, weight loss, bed-wetting, ketosis signs, acanthosis and family history.
   - During pregnancy, the gestational pattern wins.
   - "Mixed features" is used only when Type 1 and Type 2 scores are both high and less than 0.08 apart.
7. **Urgency levels:** `emergency > urgent > soon > routine`. Emergency is triggered by `urgent_flag`, `possible_dka`, severe or level-3 hypoglycemia, or critical hyperglycemia.

There are **15 possible conclusions** (`DIAGNOSIS_BY_CONCLUSION`), from `diabetes_confirmed` to `healthy_normal`. `generate_final_assessment` and `calculate_symptom_confidence` add extra layers on top.

**Rule sets**, chosen with `RULES_SEED_VERSION`:

| Seed | Rules | Notes |
|---|---|---|
| v1 | 96 | The default |
| v2 | 31 | Used by `docker-compose.yml` |
| v3 | 40 | Adds IADPSG gestational thresholds: fasting ≥ 92, 2 h OGTT ≥ 153 |

The **fact catalog** has 65 facts. The 5 cardinal facts are thirst, urination, hunger, nocturia and unquenchable thirst. 9 facts carry the emergency flag.

**Output** (`POST /api/diagnosis/`): `diagnosis`, `certainty`, `urgency`, `suspected_type`, `triggered_rules`, `recommendation`, `all_conclusions`, `explanation_trace` (the stage-by-stage trace) and `adaptive_assessment`. The result is saved as `AssessmentSession` + `AssessmentAnswer` + `DiagnosisResult`.

## 6. API endpoints
The assessment blueprint is mounted **four times**: `/api/assessment`, `/api/diagnosis`, `/api/conversational` and `/api/conversation`. The frontend uses `/api/diagnosis`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login`, `/auth/register`, `/auth/google`, `/auth/refresh` | Auth |
| POST | `/auth/logout` | Revoke tokens |
| GET/PATCH | `/auth/me` | Own profile |
| POST/DELETE | `/auth/avatar` | Upload or delete avatar |
| GET | `/auth/avatar/<file>` | Serve avatar |
| POST | `/diagnosis/`, `/diagnosis/evaluate` | Run inference (`diagnosis.run`) |
| POST | `/diagnosis/submit`, `/diagnosis/submit-to-care-team` | Send to doctors |
| GET | `/diagnosis/mine` | Own results |
| GET | `/diagnosis/recent`, `/diagnosis/review` | Review queue |
| GET | `/diagnosis/<id>` | One result |
| GET | `/diagnosis/<id>/report.pdf?lang=en\|km` | PDF report |
| PATCH | `/diagnosis/<id>/review` | Doctor review |
| GET | `/diagnosis/rule-explanation/<id>` | Explanation for a rule |
| GET/POST | `/diagnosis/start`; POST `/next`, `/complete`; GET `/questions` | Conversational interview (not used by the frontend) |
| GET/POST | `/rules/` | List / create rules |
| GET/PATCH/DELETE | `/rules/<id>` | Get / update / archive a rule |
| GET | `/rules/categories`, `/rules/<id>/versions`, `/rules/<id>/audit` | Rule metadata |
| GET/POST | `/facts/` | List / create facts |
| GET/PATCH/DELETE | `/facts/<id>` | Get / update / deactivate a fact |
| GET/POST | `/patients/` | List / register patients |
| GET/PATCH | `/patients/<id>` | Patient record |
| GET | `/patients/<id>/history` | Patient history |
| GET/POST | `/patients/<id>/symptoms`, `/patients/<id>/lab-results` | Symptoms and labs |
| GET/PATCH | `/patients/mine`; GET `/patients/mine/history` | Patient self-service |
| GET/POST | `/admin/users` | List / create users |
| GET/PATCH | `/admin/users/<id>` | Get / update a user |
| PATCH | `/admin/users/<id>/status`, `/roles`, `/access-profile` | User status and access |
| GET/POST | `/admin/roles` | List / create roles |
| PATCH/DELETE | `/admin/roles/<id>` | Update / delete a role |
| GET | `/admin/permissions`, `/admin/audit-logs`, `/admin/activity`, `/admin/stats` | Admin data |
| GET | `/dashboard/clinical` | Clinical analytics |
| GET | `/notifications`, `/notifications/unread-count` | Notifications |
| PATCH | `/notifications/<id>/read` | Mark read |
| POST | `/notifications/mark-all-read` | Mark all read |
| DELETE | `/notifications/<id>`, `/notifications/clear-read` | Delete |
| GET | `/health`, `/api/health`, `/start` | Health check and start page |

## 7. Database schema (`models/entities.py`)
- **users**: email, password_hash (nullable), google_sub, name, avatar_url, phone, department, title, hospital_affiliation, license_number, bio, is_active
- **roles** / **permissions**, with the join tables **user_roles** and **role_permissions**
- **patients**: user_id (1:1), full_name, gender, date_of_birth, height_cm, weight_kg, waist_circumference, and the booleans smoking, sedentary_lifestyle, family_history, hypertension, high_cholesterol; plus profile_completed_at
- **assessment_sessions**: patient_id, submitted_by_user_id, mode, status, timestamps
- **assessment_answers**: session_id, question_code, answer_value, answer_type
- **symptoms**: symptom_code, severity, present
- **lab_results**: test_name, test_value, unit, reference_range, measured_at
- **rules**: code, name, category, certainty_factor, priority, status, version, explanation_text
- **rule_categories**, **rule_conditions** (fact_key, operator, expected_value, sequence, logical_operator), **rule_actions** (action_type, action_value, recommendation, metadata_json), **rule_versions** (snapshot_json, change_type)
- **facts**: key, label/label_km, question/question_km, meaning(_km), prevention(_km), weight, type_indication, is_cardinal, is_emergency, aliases
- **diagnosis_results**: diagnosis, certainty, recommendation, facts_json, questionnaire_answers_json, triggered_rules_json, explanation_trace_json, review_note, reviewed_by, is_urgent, urgent_reason
- **audit_logs**, **revoked_tokens** (jti, expires_at), **notifications** (type, link, is_read)

## 8. User roles (`utils/seed.py`, 19 permissions)
| Role | Can do |
|---|---|
| `super_admin` | All 19 permissions |
| `admin` | Everything: users, roles, audit, patients, rules, diagnosis, analytics |
| `doctor` | Patients, symptoms, labs, **rule.view/manage**, diagnosis run/review, reports, analytics |
| `nurse` | Patients, symptoms, labs, running a diagnosis, reports. No rules and no review |
| `patient` | `patient.view_own`, `diagnosis.run`, `diagnosis.view_own` |

Demo accounts: `superadmin@example.com`, `admin@`, `doctor@`, `nurse@` and `patient@`. Passwords follow the pattern `<role>123`.

## 9. Standout parts
- **Full EN/Khmer bilingual support:**
  - Frontend `en.json` and `km.json` have 3,035 lines each, and a `check:locales` script checks they stay in sync.
  - The backend has message catalogs where each entry carries `{en, km}` (`utils/i18n.py`, `app/locales/*.json`).
  - Facts store Khmer questions and education text in the database.
  - Khmer PDFs render with WeasyPrint/HarfBuzz for correct text shaping, falling back to ReportLab.
- **Explainable AI:** a full trace per stage and rule (conditions, facts used, derived facts, CF contributions) plus rule explanations.
- **Clinical encoding:** ADA and IADPSG thresholds, Asian BMI cut-offs, the ADA risk score, and T1/T2 priors combined with rule votes.
- **Knowledge base editable by doctors:** fact weights overlay the engine at runtime (`apply_fact_overlay`), rules are versioned and audited, and there's a React Flow graph and a sandbox.
- **Deployment resilience:** automatic SQLite fallback, URL normalisation for `postgres://`, token revocation and rate limiting.

## 10. Known issues and incomplete parts
- **Tests:** `pytest tests` collects 137 tests.
  - 133 passed and 1 failed. The failure is `test_fact_catalog.py::test_seeding_heals_missing_facts_table` with `no such table: facts`, so seeding doesn't recreate a missing `facts` table.
  - The 3 tests in `test_db_fallback.py` were skipped because they stalled; they wait on an unreachable Postgres.
  - Loose scripts in `backend/` also break collection when pytest runs from `backend/`. For example, `test_symptom_assessment.py` imports `SYMPTOM_DATABASE`, which no longer exists.
- **Hard-coded doctor name:** `diagnosis_service.review_result` sends patients the message *"Dr. Lina reviewed your recent health summary…"* whoever the reviewer actually was.
- **Dead or unused code:**
  - `UnifiedAssessmentService` and `enhanced_inference_engine` are built in `dependencies.py` but no route uses them.
  - The conversational endpoints (`/start`, `/next`, `/complete`, `/questions`) have no auth guard (`optional_auth`) and the frontend never calls them. The UI runs its own interview in `interview-flow.js`.
  - `inference_engine` still has an unused `_resolve_top_conclusion` path. Four rule seed files exist and only one is active at a time.
- **Duplicated logic:** `RuleSimulator.jsx` evaluates conditions in the browser with its own evaluator, so it can disagree with the backend `condition_evaluator.py`.
- **Notification errors are swallowed:** `except Exception: pass` around notification sending in `evaluate`/`review_result`.
- **Avatars on local disk:** they're saved to `instance/uploads/avatars`, which is temporary storage on Vercel and Railway.
- **Rate limiter in memory:** it uses `memory://` storage by default, so it isn't shared across workers.
- **Default seed differs by environment:** the app defaults to v1, but `docker-compose.yml` sets v2.
- **Work in progress:** the Google Sign-In branch has uncommitted changes to `LoginPage.jsx` (about 300 lines removed), `SignUpPage.jsx`, `app.css`, `LanguageSwitcher.jsx` and the locale files.
