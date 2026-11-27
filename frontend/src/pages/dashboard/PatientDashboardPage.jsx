import { useEffect, useMemo, useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Footprints,
  HeartPulse,
  Pill,
  PlusCircle,
  Ruler,
  Scale,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert, DashboardSkeleton } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocaleForLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { RANGE_PRESETS, RangeRibbon, getRangeSegment } from '@/components/patient/RangeRibbon'
import { useChartPalette } from '@/components/patient/patient-palette'

// ============================================================================
// CONSTANTS & TARGET CLINICAL THRESHOLDS
// ============================================================================
const TARGET_GLUCOSE_MIN = 80
const TARGET_GLUCOSE_MAX = 130

const DEFAULT_SCHEDULE = [
  {
    id: 'sched_glucose_am',
    time: '08:00',
    timeEnd: '08:15',
    category: 'Glucose',
    badgeTone: 'amber',
    title: 'Morning Fasting Glucose',
    subtitle: 'Fasting reading before breakfast • Target: 80–130 mg/dL',
    location: 'Home Test Device',
    icon: Droplets,
  },
  {
    id: 'sched_meds_am',
    time: '08:30',
    timeEnd: '08:45',
    category: 'Medication',
    badgeTone: 'sky',
    title: 'Metformin 500mg',
    subtitle: 'Take 1 tablet with full glass of water after breakfast',
    location: 'Daily Prescription',
    icon: Pill,
  },
  {
    id: 'sched_walk_pm',
    time: '12:30',
    timeEnd: '13:00',
    category: 'Activity',
    badgeTone: 'emerald',
    title: '30-Min Post-Meal Walk',
    subtitle: 'Light aerobic cardio to improve muscle glucose uptake',
    location: 'Outdoor / Treadmill',
    icon: Footprints,
  },
  {
    id: 'sched_doctor_pm',
    time: '15:00',
    timeEnd: '15:30',
    category: 'Consultation',
    badgeTone: 'purple',
    title: 'Endocrinology Check-in',
    subtitle: 'Dr. Lina • Diabetes Care Team Review',
    location: 'Clinic Wing B, Room 204',
    icon: Stethoscope,
  },
  {
    id: 'sched_glucose_pm',
    time: '19:30',
    timeEnd: '19:45',
    category: 'Glucose',
    badgeTone: 'amber',
    title: 'Post-Dinner Glucose Log',
    subtitle: 'Check 2-hour postprandial blood sugar',
    location: 'Home Test Device',
    icon: Activity,
  },
  {
    id: 'sched_night_routine',
    time: '21:30',
    timeEnd: '22:00',
    category: 'Routine',
    badgeTone: 'slate',
    title: 'Evening Hydration & Meds',
    subtitle: 'Review daily diary and prepare for sleep',
    location: 'Care Regimen',
    icon: CheckCircle2,
  },
]

// ============================================================================
// HELPER UTILITIES
// ============================================================================
function toNumber(val) {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return Number.isNaN(num) ? null : num
}

function getGreeting(name, t) {
  const hour = new Date().getHours()
  const greeting = hour < 12
    ? t('patientHome.greeting.morning', 'Good morning')
    : hour < 17
      ? t('patientHome.greeting.afternoon', 'Good afternoon')
      : t('patientHome.greeting.evening', 'Good evening')
  return name ? `${greeting}, ${name}` : greeting
}

/** Tooltip for the weekly glucose chart. */
function ChartCustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const val = data.glucose
  const inRange = val >= TARGET_GLUCOSE_MIN && val <= TARGET_GLUCOSE_MAX
  const isHigh = val > TARGET_GLUCOSE_MAX

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lift dark:border-night-border dark:bg-night-elevated">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">{data.fullDate || data.day}</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            inRange
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300'
              : isHigh
                ? 'bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300'
          )}
        >
          {inRange ? 'In target' : isHigh ? 'Above target' : 'Below target'}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">{val}</span>
        <span className="text-xs font-medium text-slate-400">mg/dL</span>
      </div>
    </div>
  )
}

// ============================================================================
// PATIENT HOME
// ============================================================================
export function PatientDashboardPage() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const locale = getLocaleForLanguage(language)
  const [patientResults, setPatientResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calendar week offset (0 = current week)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1 // 0-indexed for Mon-Sun
  })

  // Timeline category filter
  const [timelineFilter, setTimelineFilter] = useState('all')

  // Load patient clinical records
  useEffect(() => {
    let cancelled = false

    async function loadPatientResults() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (!cancelled) {
          setPatientResults(getApiData(response) || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('patientDashboard.errors.loadFailed', 'Failed to load records')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPatientResults()
    return () => {
      cancelled = true
    }
  }, [t])

  // Health profile (risk factors captured during profile setup)
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    let cancelled = false
    api.get('/patients/mine')
      .then((response) => {
        if (!cancelled) setProfile(getApiData(response) || null)
      })
      .catch(() => {
        // The risk-factor card simply stays hidden if the profile is unavailable.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Extract latest clinical facts
  const latestResult = patientResults[0]
  const facts = latestResult?.facts || {}

  // Parse key biometrics
  const rawA1c = toNumber(facts.hba1c)
  const a1c = rawA1c !== null ? rawA1c : 6.4

  const rawGlucose = toNumber(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const glucose = rawGlucose !== null ? Math.round(rawGlucose) : 118

  const profileBmi = (() => {
    const h = toNumber(profile?.height_cm)
    const w = toNumber(profile?.weight_kg)
    return h && w ? w / ((h / 100) * (h / 100)) : null
  })()
  const rawBmi = toNumber(facts.bmi) ?? profileBmi
  const bmi = rawBmi !== null ? Number(rawBmi.toFixed(1)) : 23.5

  // High-risk assessment evaluation
  const isUrgent = Boolean(latestResult?.is_urgent) || a1c >= 8.0 || glucose >= 180

  // User Greeting
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Patient'
  const greeting = getGreeting(firstName, t)

  // 1-Sentence Diagnostic Note
  const diagnosticNote = useMemo(() => {
    if (!latestResult) {
      return t('patientHome.note.none', 'Your first assessment takes about five minutes. It sets your personal baseline so this page can show your own numbers.')
    }
    if (isUrgent) {
      return t('patientHome.note.urgent', 'Some of your recent numbers are above their target range. Keep taking your medication as prescribed and book a check-in with your doctor.')
    }
    return t('patientHome.note.stable', 'Your latest readings are holding steady. Keep following today’s plan below.')
  }, [latestResult, isUrgent, t])

  // Relative / formatted last assessment date
  const lastAssessmentDate = useMemo(() => {
    if (!latestResult?.created_at) return null
    try {
      const date = new Date(latestResult.created_at)
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return null
    }
  }, [latestResult, locale])

  // Current calendar day string
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date())
  }, [locale])

  // 7-day glucose trend data
  const trendData = useMemo(() => {
    const today = new Date()
    const variance = [-6, 8, -4, 12, -2, 5, 0]

    return variance.map((_, idx) => {
      const d = new Date()
      d.setDate(today.getDate() - (6 - idx))
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' })
      const dateStr = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
      const val = Math.max(70, Math.round(glucose + variance[idx]))

      return {
        day: dayName,
        fullDate: `${dayName}, ${dateStr}`,
        glucose: val,
      }
    })
  }, [glucose, locale])

  const avgGlucose = useMemo(() => {
    if (!trendData.length) return glucose
    return Math.round(trendData.reduce((acc, curr) => acc + curr.glucose, 0) / trendData.length)
  }, [trendData, glucose])

  // Dynamic 7-day calendar strip
  const calendarWeek = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const distToMon = (currentDay + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - distToMon + weekOffset * 7)

    const monthName = monday.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

    const days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + idx)
      const name = d.toLocaleDateString(locale, { weekday: 'short' })
      const isToday = d.toDateString() === today.toDateString()

      return {
        dayName: name,
        dayNum: d.getDate(),
        fullDate: d,
        isToday,
      }
    })

    return { monthName, days }
  }, [weekOffset, locale])

  // Selected date label in timeline header
  const selectedDateLabel = useMemo(() => {
    const selectedObj = calendarWeek.days[selectedDayIndex]
    if (!selectedObj) return formattedToday
    const label = selectedObj.fullDate.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
    return selectedObj.isToday ? t('patientHome.plan.todayLabel', 'Today · {{date}}', { date: label }) : label
  }, [calendarWeek, selectedDayIndex, formattedToday, locale, t])

  // Whether currently viewing today's schedule
  const isViewingToday = useMemo(() => {
    const selectedObj = calendarWeek.days[selectedDayIndex]
    return selectedObj ? Boolean(selectedObj.isToday) : true
  }, [calendarWeek, selectedDayIndex])

  // Real-time clock for the vertical time indicator on the timeline
  const [liveTime, setLiveTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      setLiveTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  // Task checklist state (stored in localStorage)
  const dateKey = new Date().toISOString().slice(0, 10)
  const storageKey = `saas_schedule_plan_${dateKey}`

  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : ['sched_glucose_am']
    } catch {
      return ['sched_glucose_am']
    }
  })

  const toggleTask = (taskId) => {
    setCompletedTasks((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  // Filtered timeline items
  const filteredSchedule = useMemo(() => {
    if (timelineFilter === 'all') return DEFAULT_SCHEDULE
    if (timelineFilter === 'glucose') return DEFAULT_SCHEDULE.filter((i) => i.category === 'Glucose')
    if (timelineFilter === 'meds') return DEFAULT_SCHEDULE.filter((i) => i.category === 'Medication')
    if (timelineFilter === 'activity') return DEFAULT_SCHEDULE.filter((i) => i.category === 'Activity')
    return DEFAULT_SCHEDULE
  }, [timelineFilter])

  // Dynamic chronological insertion index for the live current time marker
  const liveTimeInsertionIndex = useMemo(() => {
    if (!isViewingToday) return -1
    const idx = filteredSchedule.findIndex((item) => liveTime < item.time)
    return idx === -1 ? filteredSchedule.length : idx
  }, [filteredSchedule, liveTime, isViewingToday])

  const chart = useChartPalette()
  const hasResult = Boolean(latestResult)
  const reportHref = latestResult?.id ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}` : '/my-results'
  const glucoseSegment = getRangeSegment(RANGE_PRESETS.fastingGlucose, glucose)
  const doneToday = DEFAULT_SCHEDULE.filter((item) => completedTasks.includes(item.id)).length
  const dayProgress = Math.round((doneToday / DEFAULT_SCHEDULE.length) * 100)
  const tr = (label) => t(`patientHome.range.${label}`, label)
  // Assessments may store waist as a category code (1, 2, 3) rather than cm;
  // only treat plausible centimetre values as a measurement.
  const toWaistCm = (value) => {
    const n = toNumber(value)
    return n !== null && n >= 40 && n <= 200 ? n : null
  }
  const waist = toWaistCm(facts.waist_circumference) ?? toWaistCm(profile?.waist_circumference)
  const isFemale = (profile?.gender || facts.gender) === 'female'
  const waistPreset = isFemale ? RANGE_PRESETS.waistFemale : RANGE_PRESETS.waistMale

  if (loading && !patientResults.length) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-w-0 pb-10">
      <ErrorAlert message={error} />

      {/* ================================================================ */}
      {/* TODAY HERO — greeting, next step, and the fasting-glucose ribbon  */}
      {/* ================================================================ */}
      <section
        aria-labelledby="patient-today-heading"
        className="relative overflow-hidden rounded-[28px] bg-primary-900 text-white shadow-lift dark:bg-night-elevated dark:ring-1 dark:ring-night-border"
      >
        <GlucoseWave className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-primary-700/70 dark:text-primary-900/80" />

        <div className="relative grid gap-7 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 lg:p-10">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2.5 text-sm text-primary-100/80">
              <span>{formattedToday}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary-300/60" />
              {isUrgent ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-rose-200">
                  <AlertCircle className="h-4 w-4" />
                  {t('patientHome.status.attention', 'Needs your attention')}
                </span>
              ) : hasResult ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('patientHome.status.onTrack', 'On track')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-200">
                  <Sparkles className="h-4 w-4" />
                  {t('patientHome.status.gettingStarted', 'Getting started')}
                </span>
              )}
            </div>

            <h1
              id="patient-today-heading"
              className="mt-4 font-display text-[2.1rem] font-bold leading-[1.05] text-white sm:text-5xl"
            >
              {greeting}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-50/85">
              {diagnosticNote}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-7 sm:pt-8">
              <Link
                to="/diagnosis"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-auto rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-navy-deep shadow-[0_8px_24px_-10px_rgba(247,165,62,0.9)] transition-transform hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-0"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                {hasResult
                  ? t('patientHome.cta.newAssessment', 'Start a new assessment')
                  : t('patientHome.cta.firstAssessment', 'Take your first assessment')}
              </Link>
              <Link
                to={reportHref}
                className="inline-flex w-full items-center justify-center gap-2 sm:w-auto rounded-full px-4 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <FileText className="h-4 w-4" />
                {hasResult
                  ? t('patientHome.cta.latestReport', 'Open my latest report')
                  : t('patientHome.cta.myResults', 'My results')}
              </Link>
            </div>
          </div>

          {/* Fasting glucose reading against its range */}
          <div className="flex min-w-0 flex-col justify-between rounded-3xl bg-white/[0.07] p-5 ring-1 ring-inset ring-white/15 backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary-100">
                  {t('patientHome.vitals.fastingGlucose', 'Fasting glucose')}
                </p>
                <p className="mt-0.5 text-xs text-primary-100/70">
                  {hasResult && rawGlucose !== null && lastAssessmentDate
                    ? t('patientHome.vitals.fromAssessment', 'From your assessment on {{date}}', { date: lastAssessmentDate })
                    : t('patientHome.vitals.sample', 'Sample reading — add a blood test result to see yours')}
                </p>
              </div>
              <Droplets className="h-5 w-5 shrink-0 text-primary-200" aria-hidden="true" />
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-7xl font-bold leading-none tracking-tight text-white sm:text-8xl">
                {glucose}
              </span>
              <span className="pb-2 text-sm font-medium text-primary-100/80">
                mg/dL
                {glucoseSegment && (
                  <span className={cn('mt-1 block text-base font-bold', ribbonWordTone(glucoseSegment.tone))}>
                    {tr(glucoseSegment.label)}
                  </span>
                )}
              </span>
            </div>

            <RangeRibbon
              preset={RANGE_PRESETS.fastingGlucose}
              value={glucose}
              size="lg"
              onDark
              showLabels
              translateLabel={tr}
              className="mt-6"
            />
            <p className="mt-3 text-xs text-primary-100/70">
              {t('patientHome.vitals.normalRange', 'A normal fasting reading is 70–99 mg/dL.')}
            </p>
          </div>
        </div>
      </section>

      {/* Vitals: a swipeable strip on phones, three columns from sm up */}
      <div className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 -mb-3 sm:mx-0 sm:mb-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
        <VitalCard
          icon={Activity}
          label={t('patientHome.vitals.hba1c', 'HbA1c')}
          value={a1c.toFixed(1)}
          preset={RANGE_PRESETS.hba1c}
          rawValue={a1c}
          caption={t('patientHome.vitals.hba1cTarget', 'Normal is below 5.7%')}
          sample={!hasResult || rawA1c === null}
          t={t}
          tr={tr}
        />
        {waist !== null ? (
          <VitalCard
            icon={Ruler}
            label={t('patientHome.vitals.waist', 'Waist size')}
            value={Math.round(waist)}
            preset={waistPreset}
            rawValue={waist}
            caption={isFemale
              ? t('patientHome.vitals.waistTargetF', 'Lower risk is under 80 cm')
              : t('patientHome.vitals.waistTargetM', 'Lower risk is under 94 cm')}
            sample={false}
            t={t}
            tr={tr}
          />
        ) : (
          <VitalCard
            icon={Droplets}
            label={t('patientHome.vitals.fastingGlucose', 'Fasting glucose')}
            value={glucose}
            preset={RANGE_PRESETS.fastingGlucose}
            rawValue={glucose}
            caption={t('patientHome.vitals.glucoseTarget', 'Normal is 70–99 mg/dL')}
            sample={!hasResult || rawGlucose === null}
            t={t}
            tr={tr}
          />
        )}
        <VitalCard
          icon={Scale}
          label={t('patientHome.vitals.bmi', 'Body mass index')}
          value={bmi.toFixed(1)}
          preset={RANGE_PRESETS.bmi}
          rawValue={bmi}
          caption={t('patientHome.vitals.bmiTarget', 'Healthy is 18.5–24.9')}
          sample={rawBmi === null}
          t={t}
          tr={tr}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        {/* ============================================================== */}
        {/* LEFT: weekly trend, risk factors, latest assessment              */}
        {/* ============================================================== */}
        <div className="min-w-0 space-y-6">
          {/* Weekly trend */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lift sm:p-6 dark:border-night-border dark:bg-night-surface">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {t('patientHome.trend.title', 'Your week in glucose')}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t('patientHome.trend.subtitle', 'Morning readings against the 80–130 mg/dL target band')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="h-3 w-5 rounded-[4px] border border-emerald-500/50 bg-emerald-500/15" aria-hidden="true" />
                  {t('patientHome.trend.targetBand', 'Target band')}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {t('patientHome.trend.average', 'Average')}{' '}
                  <strong className="font-display text-lg text-slate-900 dark:text-white">{avgGlucose}</strong>
                </span>
              </div>
            </div>

            <div className="mt-5 h-60 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="patientGlucoseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.line} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={chart.line} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: chart.axis }} dy={6} />
                  <YAxis domain={[60, 180]} ticks={[80, 130, 180]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: chart.axis }} />
                  <Tooltip content={<ChartCustomTooltip />} cursor={{ stroke: chart.axis, strokeDasharray: '3 3' }} />
                  <ReferenceArea y1={TARGET_GLUCOSE_MIN} y2={TARGET_GLUCOSE_MAX} fill={chart.inRange} fillOpacity={0.1} stroke="none" />
                  <ReferenceLine y={TARGET_GLUCOSE_MAX} stroke={chart.inRange} strokeOpacity={0.45} strokeDasharray="4 4" />
                  <ReferenceLine y={TARGET_GLUCOSE_MIN} stroke={chart.inRange} strokeOpacity={0.45} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="glucose"
                    stroke={chart.line}
                    strokeWidth={2.5}
                    fill="url(#patientGlucoseFill)"
                    dot={{ r: 4, fill: chart.line, strokeWidth: 2, stroke: chart.surface }}
                    activeDot={{ r: 6, fill: chart.lineStrong, stroke: chart.surface, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {rawGlucose === null
                ? t('patientHome.trend.sampleNote', 'Sample week shown. Add a fasting glucose result to an assessment to centre it on your own reading.')
                : t('patientHome.trend.estimateNote', 'An illustration built around your latest reading of {{value}} mg/dL.', { value: glucose })}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RiskFactorsCard profile={profile} t={t} />
            <LatestAssessmentCard
              result={latestResult}
              dateLabel={lastAssessmentDate}
              isUrgent={isUrgent}
              reportHref={reportHref}
              t={t}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT: today's plan — week strip + timeline                    */}
        {/* ============================================================== */}
        <aside
          aria-labelledby="patient-plan-heading"
          className="order-first min-w-0 rounded-3xl xl:order-none border border-slate-200/80 bg-white p-5 shadow-lift sm:p-6 dark:border-night-border dark:bg-night-surface"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="patient-plan-heading" className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {t('patientHome.plan.title', 'Your day')}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('patientHome.plan.progress', '{{done}} of {{total}} done', { done: doneToday, total: DEFAULT_SCHEDULE.length })}
              </p>
            </div>
            <ProgressDial value={dayProgress} />
          </div>

          {/* Week strip */}
          <div className="mt-6 rounded-2xl bg-slate-50 p-3 dark:bg-night-elevated">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{calendarWeek.monthName}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-night-border dark:hover:text-white"
                  aria-label={t('patientHome.plan.prevWeek', 'Previous week')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-night-border dark:hover:text-white"
                  aria-label={t('patientHome.plan.nextWeek', 'Next week')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center">
              {calendarWeek.days.map((item, idx) => {
                const isSelected = idx === selectedDayIndex
                return (
                  <button
                    key={item.fullDate.toDateString()}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500',
                      isSelected
                        ? 'bg-primary-700 text-white shadow-sm dark:bg-primary-500 dark:text-navy-deep'
                        : 'text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-night-border'
                    )}
                  >
                    <span className={cn('block w-full truncate px-0.5 text-[11px] font-medium', isSelected ? 'text-primary-100 dark:text-navy-deep/80' : 'text-slate-400')}>
                      {item.dayName}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{item.dayNum}</span>
                    <span
                      className={cn(
                        'h-1 w-1 rounded-full',
                        item.isToday ? (isSelected ? 'bg-amber-300' : 'bg-primary-500') : 'bg-transparent'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Timeline header */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedDateLabel}</h3>
            <div className="relative">
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                aria-label={t('patientHome.plan.filter', 'Filter tasks')}
                className="appearance-none rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-night-border dark:bg-night-elevated dark:text-slate-200"
              >
                <option value="all">{t('patientHome.plan.filterAll', 'Everything')}</option>
                <option value="glucose">{t('patientHome.plan.filterGlucose', 'Glucose')}</option>
                <option value="meds">{t('patientHome.plan.filterMeds', 'Medication')}</option>
                <option value="activity">{t('patientHome.plan.filterActivity', 'Activity')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Timeline */}
          <ol className="relative mt-4">
            <span aria-hidden="true" className="absolute bottom-3 left-[3.25rem] top-3 w-px bg-slate-200 dark:bg-night-border" />
            {isViewingToday && liveTimeInsertionIndex === 0 && <NowMarker time={liveTime} t={t} />}
            {filteredSchedule.map((item, idx) => {
              const isCompleted = completedTasks.includes(item.id)
              const tone = CATEGORY_TONES[item.badgeTone] || CATEGORY_TONES.slate
              const Icon = item.icon
              const showLiveMarkerAfter = isViewingToday && liveTimeInsertionIndex === idx + 1
              return (
                <Fragment key={item.id}>
                  <li className="relative grid grid-cols-[2.5rem_1.5rem_minmax(0,1fr)] items-start gap-2 pb-3">
                    <span className="pt-3.5 text-right text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      {item.time}
                    </span>
                    <span className="relative z-10 flex justify-center pt-3.5">
                      <span
                        className={cn(
                          'h-3 w-3 rounded-full ring-4 ring-white dark:ring-night-surface',
                          isCompleted ? 'bg-emerald-500' : 'border-2 border-slate-300 bg-white dark:border-slate-500 dark:bg-night-surface'
                        )}
                      />
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleTask(item.id)}
                      aria-pressed={isCompleted}
                      className={cn(
                        'group flex min-w-0 items-start gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500',
                        isCompleted
                          ? 'border-transparent bg-slate-50 dark:bg-night-elevated/60'
                          : 'border-slate-200/80 bg-white hover:border-primary-300 dark:border-night-border dark:bg-night-surface dark:hover:border-primary-700'
                      )}
                    >
                      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone.icon)}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[11px] font-semibold', tone.text)}>
                          {t(`patientHome.category.${item.category.toLowerCase()}`, item.category)}
                        </span>
                        <span
                          className={cn(
                            'block text-sm font-semibold leading-snug',
                            isCompleted ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                          )}
                        >
                          {t(`patientHome.schedule.${item.id}.title`, item.title)}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
                          {t(`patientHome.schedule.${item.id}.subtitle`, item.subtitle)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 text-transparent group-hover:border-primary-400 dark:border-slate-600'
                        )}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </button>
                  </li>
                  {showLiveMarkerAfter && <NowMarker time={liveTime} t={t} />}
                </Fragment>
              )
            })}
          </ol>

          <Link
            to="/care-plan"
            className="mt-4 flex items-center justify-between rounded-2xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-200 dark:hover:bg-primary-950"
          >
            {t('patientHome.plan.openCarePlan', 'Open my full care plan')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const CATEGORY_TONES = {
  amber: { icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300', text: 'text-amber-700 dark:text-amber-300' },
  sky: { icon: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300', text: 'text-sky-700 dark:text-sky-300' },
  emerald: { icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300', text: 'text-emerald-700 dark:text-emerald-300' },
  purple: { icon: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300', text: 'text-purple-700 dark:text-purple-300' },
  slate: { icon: 'bg-slate-100 text-slate-600 dark:bg-night-elevated dark:text-slate-300', text: 'text-slate-500 dark:text-slate-400' },
}

function ribbonWordTone(tone) {
  if (tone === 'good') return 'text-emerald-200'
  if (tone === 'watch') return 'text-amber-200'
  return 'text-rose-200'
}

const STATUS_CHIP = {
  good: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  watch: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  low: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
}

function VitalCard({ icon: Icon, label, value, preset, rawValue, caption, sample, t, tr }) {
  const segment = getRangeSegment(preset, rawValue)
  return (
    <div className="flex w-[80%] shrink-0 snap-start flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lift sm:w-auto dark:border-night-border dark:bg-night-surface">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          {label}
        </span>
        {segment && (
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_CHIP[segment.tone])}>
            {tr(segment.label)}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        <span className="text-sm text-slate-400">{preset.unit}</span>
      </div>
      <RangeRibbon preset={preset} value={rawValue} className="mt-4" />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {caption}
        {sample && (
          <span className="ml-1 text-slate-400 dark:text-slate-500">
            · {t('patientHome.vitals.sampleShort', 'sample')}
          </span>
        )}
      </p>
    </div>
  )
}

function ProgressDial({ value }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative h-14 w-14 shrink-0" role="img" aria-label={`${value}%`}>
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="5" className="stroke-slate-100 dark:stroke-night-border" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-emerald-500 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
        {value}%
      </span>
    </div>
  )
}

function NowMarker({ time, t }) {
  return (
    <li className="relative grid grid-cols-[2.5rem_1.5rem_minmax(0,1fr)] items-center gap-2 pb-3" aria-label={t('patientHome.plan.now', 'Now')}>
      <span className="text-right text-xs font-bold tabular-nums text-amber-700 dark:text-amber-300">{time}</span>
      <span className="relative z-10 flex justify-center">
        <span className="h-3 w-3 rounded-full bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-950" />
      </span>
      <span className="h-px bg-amber-300/80 dark:bg-amber-700/70" />
    </li>
  )
}

const RISK_FACTORS = [
  { key: 'family_history', label: 'Family history of diabetes' },
  { key: 'hypertension', label: 'High blood pressure' },
  { key: 'high_cholesterol', label: 'High cholesterol' },
  { key: 'smoking', label: 'Smoking' },
  { key: 'sedentary_lifestyle', label: 'Mostly inactive days' },
]

function RiskFactorsCard({ profile, t }) {
  const active = RISK_FACTORS.filter((factor) => Boolean(profile?.[factor.key]))
  return (
    <section className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lift sm:p-6 dark:border-night-border dark:bg-night-surface">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
        {t('patientHome.risk.title', 'What shapes your risk')}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {profile
          ? t('patientHome.risk.subtitle', '{{count}} of {{total}} factors apply to you', { count: active.length, total: RISK_FACTORS.length })
          : t('patientHome.risk.loading', 'From your health profile')}
      </p>
      <ul className="mt-4 space-y-2">
        {RISK_FACTORS.map((factor) => {
          const applies = Boolean(profile?.[factor.key])
          return (
            <li
              key={factor.key}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm',
                applies ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100' : 'bg-slate-50 text-slate-500 dark:bg-night-elevated dark:text-slate-400'
              )}
            >
              <span className="font-medium">{t(`patientHome.risk.${factor.key}`, factor.label)}</span>
              <span className={cn('text-xs font-semibold', applies ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400')}>
                {applies ? t('patientHome.risk.applies', 'Applies') : t('patientHome.risk.notApplies', 'No')}
              </span>
            </li>
          )
        })}
      </ul>
      <Link
        to="/profile"
        className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
      >
        <User className="h-4 w-4" />
        {t('patientHome.risk.update', 'Update my health profile')}
      </Link>
    </section>
  )
}

function LatestAssessmentCard({ result, dateLabel, isUrgent, reportHref, t }) {
  if (!result) {
    return (
      <section className="flex flex-col rounded-3xl border border-dashed border-primary-300 bg-primary-50/60 p-5 sm:p-6 dark:border-primary-800 dark:bg-primary-950/30">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-sm dark:bg-night-elevated dark:text-primary-300">
          <Stethoscope className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">
          {t('patientHome.latest.emptyTitle', 'No assessment yet')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t('patientHome.latest.emptyBody', 'Answer a few questions about how you feel and any recent lab numbers. It takes about five minutes, and your result appears here with clear next steps.')}
        </p>
        <Link
          to="/diagnosis"
          className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 dark:bg-primary-500 dark:text-navy-deep dark:hover:bg-primary-400"
          style={{ marginTop: '1.5rem' }}
        >
          {t('patientHome.cta.firstAssessment', 'Take your first assessment')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    )
  }

  const certainty = Number(result.certainty)
  const certaintyPct = Number.isFinite(certainty) ? Math.round(certainty <= 1 ? certainty * 100 : certainty) : null

  return (
    <section className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lift sm:p-6 dark:border-night-border dark:bg-night-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {t('patientHome.latest.title', 'Latest assessment')}
          </h2>
          {dateLabel && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dateLabel}</p>}
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            isUrgent ? STATUS_CHIP.high : STATUS_CHIP.good
          )}
        >
          {isUrgent ? t('patientHome.latest.urgent', 'See a doctor soon') : t('patientHome.latest.routine', 'Routine follow-up')}
        </span>
      </div>

      <p className="mt-5 font-display text-2xl font-bold leading-tight text-slate-900 dark:text-white">
        {result.diagnosis || t('patientHome.latest.pending', 'Result pending')}
      </p>
      {certaintyPct !== null && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('patientHome.latest.certainty', 'Confidence {{value}}%', { value: certaintyPct })}
        </p>
      )}

      {result.recommendation && (
        <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{result.recommendation}</p>
      )}

      {result.review_note && (
        <blockquote className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-night-elevated dark:text-slate-200">
          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('patientHome.latest.doctorNote', 'Note from {{name}}', { name: result.reviewed_by_name || t('patientHome.latest.careTeam', 'your care team') })}
          </span>
          {result.review_note}
        </blockquote>
      )}

      <Link
        to={reportHref}
        className="mt-auto inline-flex items-center gap-1.5 self-start pt-5 text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
      >
        {t('patientHome.latest.open', 'Read the full report')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}

/** A soft glucose curve drawn behind the hero — the day's rhythm as decoration. */
function GlucoseWave({ className }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        d="M0 120 C 120 120, 160 60, 260 70 S 400 140, 520 110 S 680 30, 800 60 S 980 130, 1080 100 S 1160 80, 1200 84"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M0 140 C 140 135, 200 95, 300 100 S 460 150, 560 132 S 720 70, 840 88 S 1000 146, 1100 124 S 1170 112, 1200 114"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
    </svg>
  )
}
