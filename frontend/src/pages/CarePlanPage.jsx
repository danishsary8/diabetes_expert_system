import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  PlusCircle,
  ShieldAlert,
  Siren,
  Sparkles,
  Stethoscope,
  UserCheck,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocaleForLanguage } from '@/lib/i18n'
import { ErrorAlert, LoadingState, StatusBadge, Skeleton, StatCardsSkeleton, CardListSkeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  CarePlanActivitySnapshot,
  CarePlanAppointments,
  CarePlanGoals,
  CarePlanMedications,
  CarePlanProgressTracker,
  CarePlanVitalsSnapshot,
} from '@/components/dashboard/patient/CarePathHubComponents'
import { AppointmentCalendarCanvas } from '@/components/dashboard/patient/AppointmentCalendarCanvas'
import { CarePlanPrevention } from '@/components/dashboard/patient/CarePlanPrevention'
import { getTreatmentPlanForUser } from '@/lib/treatmentPlanStore'
import { TreatmentPlanDetailView } from '@/components/dashboard/treatment/TreatmentPlanDetailView'
import {
  getDaysSinceCheck,
  getLatestFacts,
  getRelativeCheckAge,
  getReportedSymptomLabels,
  getUrgencyLabel,
} from '@/components/dashboard/patient/patient-dashboard-utils'

const SAFETY_ITEM_KEYS = [1, 2, 3, 4, 5].map((n) => `patientDashboard.carePlanPage.safety.item${n}`)

const TABS = ['Overview', 'Treatment Plan', 'Medications', 'Appointments']
const PHASES = [
  'Phase 1: Clinical Stabilization',
  'Phase 2: Active Intervention',
  'Phase 3: Long-term Maintenance',
]

function DoctorNoteCard({ latestResult, t }) {
  const { isKhmer } = useLanguage()
  const isUrgent = Boolean(latestResult?.is_urgent)
  const reviewer = latestResult?.reviewed_by_user
  const reviewerName = reviewer?.name ? (reviewer.name.startsWith('Dr.') ? reviewer.name : `Dr. ${reviewer.name}`) : null

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
            <Stethoscope className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-slate-100">
              {t('patientDashboard.carePlanPage.doctorNote.title', "Doctor's Clinical Note")}
            </h2>
            {reviewerName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('patientDashboard.carePlanPage.doctorNote.reviewedBy', 'Reviewed by {{doctor}}', { doctor: reviewerName })}
              </p>
            )}
          </div>
        </div>

        {latestResult.review_note ? (
          <StatusBadge tone="success" size="sm" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t('patientDashboard.carePlanPage.doctorNote.officialBadge', 'Verified Clinical Review')}</span>
          </StatusBadge>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" />
            <span>{t('patientDashboard.carePlanPage.doctorNote.awaitingTitle', 'Awaiting Clinical Review')}</span>
          </span>
        )}
      </div>

      {latestResult.review_note ? (
        <div className="mt-4 rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50/30 to-sky-50/20 p-5 text-sm leading-7 text-slate-800 dark:border-primary-900/60 dark:from-primary-950/30 dark:to-slate-900/40 dark:text-slate-200">
          <div className="flex items-start gap-3">
            <UserCheck className="mt-1 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
            <div className="min-w-0 flex-1">
              <p className="font-serif italic text-slate-800 dark:text-slate-200">
                &ldquo;{latestResult.review_note}&rdquo;
              </p>
              {latestResult.reviewed_at && (
                <p className="mt-2 text-right text-[11px] font-sans font-medium text-slate-400 dark:text-slate-500">
                  {new Date(latestResult.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
          {t('patientDashboard.carePlanPage.doctorNote.awaitingDescription', 'Your assessment is currently logged in the clinic review queue. When your physician reviews your case, their official notes, lab interpretations, and personalized guidance will appear here.')}
        </div>
      )}

      {/* Priority guidance box */}
      {isUrgent && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200/80 bg-rose-50/60 p-4 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
              {t('patientDashboard.carePlan.currentPriority', 'Current priority: Urgent Action')}
            </h3>
            <p className="mt-1 text-sm leading-6 text-rose-800 dark:text-rose-300">
              {t('patientDashboard.carePlan.urgentPriorityText')}
            </p>
            {latestResult.urgent_reason ? (
              <p className="mt-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                {t('patientDashboard.situation.urgentReason', 'Reason: {{reason}}', {
                  reason: isKhmer ? (latestResult.urgent_reason_km || latestResult.urgent_reason) : latestResult.urgent_reason,
                })}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}

function SafetyCard({ t }) {
  return (
    <section className="min-w-0 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
          <Siren className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          {t('patientDashboard.carePlanPage.safety.title', 'Seek care urgently if')}
        </h3>
      </div>
      <ul className="mt-3.5 space-y-2.5">
        {SAFETY_ITEM_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span className="text-xs leading-5 text-rose-900/90 dark:text-rose-200/90">{t(key)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-rose-200/70 pt-3 text-[11px] leading-4 text-rose-700/80 dark:border-rose-900/50 dark:text-rose-300/80">
        {t('patientDashboard.carePlanPage.safety.footnote', "This list doesn't replace medical advice. In an emergency, call your local emergency number.")}
      </p>
    </section>
  )
}

export function CarePlanPage() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [selectedPhase, setSelectedPhase] = useState('Phase 2: Active Intervention')
  const [phaseDropdownOpen, setPhaseDropdownOpen] = useState(false)

  const patientPlan = useMemo(() => {
    return getTreatmentPlanForUser(user?.name, user?.email)
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function loadResults() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (!cancelled) {
          setResults(getApiData(response) || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('patientDashboard.carePlanPage.loadFailed')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResults()
    return () => {
      cancelled = true
    }
  }, [t])

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-150">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <StatCardsSkeleton count={4} />
        <CardListSkeleton count={3} />
      </div>
    )
  }

  const latestResult = results[0]
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Patient'
  const isUrgent = Boolean(latestResult?.is_urgent)

  const formattedToday = new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  const lastCheckDate = latestResult?.created_at
    ? getRelativeCheckAge(latestResult.created_at, t) ?? 'Today'
    : 'Recent'

  return (
    <div className="space-y-6 pb-12">
      <ErrorAlert message={error} />

      {/* ==================================================================== */}
      {/* 1. HERO — matches the pine "today" panel on the patient home page    */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-[28px] bg-primary-900 p-6 text-white shadow-lift sm:p-8 lg:p-10 dark:bg-night-elevated dark:ring-1 dark:ring-night-border">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-primary-700/70 dark:text-primary-900/80">
          <path d="M0 120 C 120 120, 160 60, 260 70 S 400 140, 520 110 S 680 30, 800 60 S 980 130, 1080 100 S 1160 80, 1200 84" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-primary-100/80">
            <span>{formattedToday}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary-300/60" />
            {isUrgent ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-rose-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300" />
                {t('carePlanHero.attention', 'Needs your attention')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {t('carePlanHero.routine', 'Routine monitoring')}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.05] text-white sm:text-5xl">
            {t('carePlanHero.title', 'Your care plan, {{name}}', { name: firstName })}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-50/85">
            {latestResult?.diagnosis
              ? t('carePlanHero.withResult', 'Built around your latest result: {{diagnosis}}. Work through today’s goals, take your medication on time, and keep your appointments.', { diagnosis: latestResult.diagnosis })
              : t('carePlanHero.noResult', 'Daily goals, medication times and appointments in one place. Take a health check to tailor it to you.')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('Treatment Plan')}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-navy-deep shadow-[0_8px_24px_-10px_rgba(247,165,62,0.9)] transition-transform hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                <Stethoscope className="h-4.5 w-4.5" />
                {t('carePlanHero.treatmentPlan', 'See my doctor’s plan')}
              </button>
              <Link
                to={latestResult?.id ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}` : '/my-results'}
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10"
              >
                <FileText className="h-4 w-4" />
                {t('carePlanHero.report', 'Open my report')}
              </Link>
              <Link
                to="/diagnosis"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                <PlusCircle className="h-4 w-4" />
                {t('carePlanHero.newCheck', 'New health check')}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-primary-100/75">
              <CalendarClock className="h-4 w-4" />
              <span>{t('carePlanHero.lastCheck', 'Last check: {{date}}', { date: lastCheckDate })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. NAVIGATION PILLS & PHASE SELECTOR BAR                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-0.5">
        {/* Navigation Tab Pills styled like Dashboard */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-primary-800 text-white shadow-sm dark:bg-primary-400 dark:text-navy-deep'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
              >
                {t(`carePlanCards.tabs.${tab.replace(/\s+/g, '')}`, tab)}
              </button>
            )
          })}
        </div>

        {/* Phase Plan Selector Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPhaseDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{selectedPhase}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {phaseDropdownOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {PHASES.map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => {
                    setSelectedPhase(phase)
                    setPhaseDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition',
                    selectedPhase === phase
                      ? 'bg-primary-50 text-primary-700 font-bold dark:bg-primary-950/60 dark:text-primary-300'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  )}
                >
                  {phase}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. Two-column layout: daily care on the left, progress on the right */}
      {/* ==================================================================== */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ================================================================ */}
          {/* LEFT COLUMN (8 cols / ~67%): Main Protocol & Regimen Actions     */}
          {/* ================================================================ */}
          <div className="xl:col-span-8 space-y-6 min-w-0">
            {/* 1. Today's Care Goals (Daily Checklist) */}
            <CarePlanGoals t={t} />

            {/* 2. Prescribed Medications Table */}
            <CarePlanMedications t={t} />

            {/* 3. Prevention & Lifestyle Strategy */}
            {latestResult && <CarePlanPrevention latestResult={latestResult} t={t} />}

            {/* 4. Doctor's Official Clinical Note */}
            {latestResult && <DoctorNoteCard latestResult={latestResult} t={t} />}
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN (4 cols / ~33%): Milestones, Visits, Biometrics     */}
          {/* ================================================================ */}
          <div className="xl:col-span-4 space-y-6 min-w-0">
            {/* 1. Care Plan Progress Tracker (Milestone Stepper) */}
            <CarePlanProgressTracker t={t} />

            {/* 2. Upcoming Appointments & Lab Orders */}
            <CarePlanAppointments t={t} />

            {/* 3. Dual Biometric Snapshot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
              <CarePlanVitalsSnapshot results={results} t={t} />
              <CarePlanActivitySnapshot t={t} />
            </div>

            {/* 4. Emergency Red Flags & Safety */}
            <SafetyCard t={t} />
          </div>
        </div>
      )}

      {/* Tab: Treatment Plan (Official Doctor Plan matching Screenshot 2) */}
      {activeTab === 'Treatment Plan' && (
        <div className="space-y-6">
          <TreatmentPlanDetailView
            plan={patientPlan}
            onBack={() => setActiveTab('Overview')}
            isDoctor={false}
            t={t}
          />
        </div>
      )}

      {/* Tab: Medications */}
      {activeTab === 'Medications' && (
        <div className="space-y-6">
          <CarePlanMedications t={t} />
          {latestResult && <CarePlanPrevention latestResult={latestResult} t={t} />}
        </div>
      )}

      {/* Tab: Appointments with interactive Calendar Canvas */}
      {activeTab === 'Appointments' && (
        <div className="space-y-6">
          <AppointmentCalendarCanvas t={t} />
        </div>
      )}
    </div>
  )
}
