import { useState } from 'react'
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Footprints,
  HeartPulse,
  Pill,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocaleForLanguage } from '@/lib/i18n'
import { RANGE_PRESETS, RangeRibbon, getRangeSegment } from '@/components/patient/RangeRibbon'

// ============================================================================
// 1. TODAY'S CARE GOALS
// ============================================================================
const DAILY_HABITS = [
  {
    id: 'goal-glucose-am',
    title: 'Morning fasting glucose check',
    time: '08:00',
    target: 'Before breakfast · target 80–130 mg/dL',
    icon: Droplets,
    badgeColor: 'amber',
  },
  {
    id: 'goal-meds-am',
    title: 'Morning medication',
    time: '08:30',
    target: 'Take it exactly as your doctor prescribed',
    icon: Pill,
    badgeColor: 'sky',
  },
  {
    id: 'goal-exercise-pm',
    title: '30-minute walk after a meal',
    time: '12:30',
    target: 'Helps your muscles use blood sugar',
    icon: Footprints,
    badgeColor: 'emerald',
  },
  {
    id: 'goal-foot-pm',
    title: 'Check your feet',
    time: '20:00',
    target: 'Look for cuts, redness or pressure spots',
    icon: HeartPulse,
    badgeColor: 'rose',
  },
]

export function CarePlanGoals({ t }) {
  const [goals, setGoals] = useState(() =>
    DAILY_HABITS.map((habit) => ({
      ...habit,
      title: t(`carePlanCards.habits.${habit.id}.title`, habit.title),
      target: t(`carePlanCards.habits.${habit.id}.target`, habit.target),
      completed: false,
    }))
  )

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    )
  }

  const completedCount = goals.filter((g) => g.completed).length
  const progressPercent = Math.round((completedCount / goals.length) * 100)

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
      {/* Card Header matching Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t('carePlanCards.goalsTitle', "Today's Care Goals")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('carePlanCards.goalsSubtitle', 'Daily diabetes management tasks and health habits')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('carePlanCards.goalsProgress', '{{done}} of {{total}} done ({{percent}}%)', { done: completedCount, total: goals.length, percent: progressPercent })}
          </span>
        </div>
      </div>

      {/* Goal Items - Clean, seamless list with elegant hover and no harsh borders */}
      <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/60">
        {goals.map((goal) => {
          const Icon = goal.icon
          const isDone = goal.completed

          return (
            <div
              key={goal.id}
              role="button"
              tabIndex={0}
              aria-pressed={isDone}
              onClick={() => toggleGoal(goal.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  toggleGoal(goal.id)
                }
              }}
              className={cn(
                'group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-3.5 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 sm:gap-3.5 sm:px-3',
                isDone
                  ? 'bg-slate-50/40 hover:bg-slate-50/80 dark:bg-slate-800/20 dark:hover:bg-slate-800/40'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              )}
            >
              {/* Left: Category Icon + Title & Schedule */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors shadow-2xs',
                    goal.badgeColor === 'amber' &&
                      'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
                    goal.badgeColor === 'sky' &&
                      'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300',
                    goal.badgeColor === 'emerald' &&
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
                    goal.badgeColor === 'rose' &&
                      'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <h3
                    className={cn(
                      'text-sm font-bold leading-snug tracking-tight transition-colors sm:truncate',
                      isDone
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {goal.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {goal.time}
                    </span>{' '}
                    • {goal.target}
                  </p>
                </div>
              </div>

              {/* Right: Status Pill Button (Clean, no harsh thick borders) */}
              <div className="shrink-0">
                {isDone ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 p-1.5 text-xs font-semibold text-emerald-700 sm:px-3 sm:py-1 transition-colors dark:bg-emerald-950/50 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span className="sr-only sm:not-sr-only">{t('carePlanCards.completed', 'Completed')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1.5 text-xs font-medium text-slate-600 sm:px-3 sm:py-1 transition-colors group-hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700/80">
                    <span className="sr-only sm:not-sr-only">{t('carePlanCards.scheduled', 'Scheduled')}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================================
// Shared pieces
// ============================================================================
const CARD = 'flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lift dark:border-night-border dark:bg-night-surface'

function CardHeader({ title, subtitle, aside, as: Heading = 'h2' }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-start sm:justify-between dark:border-night-border">
      <div className="min-w-0">
        <Heading className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</Heading>
        {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {aside}
    </div>
  )
}

function EmptyNote({ icon: Icon, children }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-600 dark:border-night-border dark:bg-night-elevated/50 dark:text-slate-300">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

function formatPlanDate(value, locale) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return {
    month: date.toLocaleDateString(locale, { month: 'short' }),
    day: date.toLocaleDateString(locale, { day: '2-digit' }),
  }
}

// ============================================================================
// 2. MEDICATIONS — from the patient's treatment plan
// ============================================================================
export function CarePlanMedications({ plan, t }) {
  const planMeds = plan?.medications || []
  const [taken, setTaken] = useState({})

  return (
    <section className={CARD}>
      <CardHeader
        title={t('carePlanCards.medsTitle', 'Prescribed Medications')}
        subtitle={plan?.doctorName
          ? t('carePlanCards.medsFrom', 'From the plan written by {{doctor}}', { doctor: plan.doctorName })
          : t('carePlanCards.medsSubtitle', 'Active pharmacotherapy regimen and dosing schedule')}
      />

      {planMeds.length === 0 ? (
        <EmptyNote icon={Pill}>
          {t('carePlanCards.medsEmpty', 'No medicines are on file for you yet. When your doctor adds a treatment plan, your medicines and how to take them will appear here.')}
        </EmptyNote>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100 dark:divide-night-border">
          {planMeds.map((med) => {
            const isTaken = Boolean(taken[med.name])
            return (
              <li key={med.name} className="flex items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {med.name}
                    <span className="ml-2 font-semibold text-slate-500 dark:text-slate-400">{med.dosage}</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                    <span>{med.frequency}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTaken((prev) => ({ ...prev, [med.name]: !prev[med.name] }))}
                  aria-pressed={isTaken}
                  aria-label={isTaken
                    ? t('carePlanCards.medUntake', 'Mark {{name}} as not taken today', { name: med.name })
                    : t('carePlanCards.medTake', 'Mark {{name}} as taken today', { name: med.name })}
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500',
                    isTaken
                      ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                      : 'border-slate-300 text-transparent hover:border-emerald-500 dark:border-slate-600'
                  )}
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ============================================================================
// 3. APPOINTMENTS — scheduled items from the treatment plan
// ============================================================================
export function CarePlanAppointments({ plan, t }) {
  const { language } = useLanguage()
  const locale = getLocaleForLanguage(language)
  const today = new Date().toISOString().slice(0, 10)
  const scheduled = (plan?.procedures || [])
    .filter((item) => item.status === 'Scheduled' && item.scheduledDate >= today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  return (
    <section className={CARD}>
      <CardHeader
        as="h3"
        title={t('carePlanCards.apptsTitle', 'Upcoming Appointments')}
        subtitle={t('carePlanCards.apptsSubtitle', 'Scheduled consultations and lab work orders')}
        aside={scheduled.length ? (
          <span className="shrink-0 self-start whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-night-elevated dark:text-slate-300">
            {t('carePlanCards.apptsCount', '{{count}} scheduled', { count: scheduled.length })}
          </span>
        ) : null}
      />

      {scheduled.length === 0 ? (
        <EmptyNote icon={Calendar}>
          {t('carePlanCards.apptsEmpty', 'Nothing is booked yet. Your clinic will add check-ups and lab tests here. To book or change a visit, contact your clinic directly.')}
        </EmptyNote>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100 dark:divide-night-border">
          {scheduled.map((item) => {
            const date = formatPlanDate(item.scheduledDate, locale)
            return (
              <li key={item.id} className="flex items-start gap-3.5 py-3">
                <div className="flex min-w-[46px] flex-col items-center justify-center rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-night-elevated">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{date?.month || '—'}</span>
                  <span className="text-base font-extrabold leading-tight text-slate-900 dark:text-slate-100">{date?.day || ''}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">{item.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ============================================================================
// 4. PROGRESS — milestones from the treatment plan
// ============================================================================
export function CarePlanProgressTracker({ plan, t }) {
  const milestones = plan?.milestones || []
  const doneCount = milestones.filter((step) => step.completed).length
  const activeIndex = milestones.findIndex((step) => !step.completed)

  return (
    <section className={CARD}>
      <CardHeader
        as="h3"
        title={t('carePlanCards.progressTitle', 'Care Plan Progress')}
        subtitle={plan?.protocolName || null}
        aside={plan?.phase ? (
          <span className="self-start rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {plan.phase}
          </span>
        ) : null}
      />

      {milestones.length === 0 ? (
        <EmptyNote icon={Sparkles}>
          {t('carePlanCards.progressEmpty', 'Your progress appears here once your doctor starts a treatment plan with you.')}
        </EmptyNote>
      ) : (
        <ol className="mt-4 space-y-3">
          <li aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-night-border">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((doneCount / milestones.length) * 100)}%` }} />
          </li>
          {milestones.map((step, idx) => {
            const isActive = idx === activeIndex
            return (
              <li key={step.title} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    step.completed && 'border-emerald-500 bg-emerald-500 text-white',
                    isActive && 'border-emerald-500 bg-white ring-4 ring-emerald-100 dark:bg-night-surface dark:ring-emerald-950/80',
                    !step.completed && !isActive && 'border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-night-elevated'
                  )}
                >
                  {step.completed && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold leading-snug', step.completed || isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400')}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step.date}
                    {isActive ? ` · ${t('carePlanCards.progressNow', 'You are here')}` : ''}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// ============================================================================
// 5. LATEST FASTING GLUCOSE — only a real reading, shown against its range
// ============================================================================
export function CarePlanVitalsSnapshot({ results = [], t }) {
  const facts = results[0]?.facts || {}
  const raw = Number(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const glucose = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null
  const segment = glucose === null ? null : getRangeSegment(RANGE_PRESETS.fastingGlucose, glucose)

  return (
    <section className={CARD}>
      <CardHeader as="h3" title={t('carePlanCards.vitalsTitle', 'Vitals Trend')} />
      {glucose === null ? (
        <EmptyNote icon={Droplets}>
          {t('carePlanCards.vitalsEmpty', 'No fasting glucose reading yet. Add one in your next health check to see it here against the healthy range.')}
        </EmptyNote>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p>
              <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">{glucose}</span>
              <span className="ml-1 text-xs text-slate-500">mg/dL</span>
            </p>
            {segment ? (
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t(`patientHome.range.${segment.label}`, segment.label)}
              </span>
            ) : null}
          </div>
          <RangeRibbon preset={RANGE_PRESETS.fastingGlucose} value={glucose} className="mt-3" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t('patientHome.vitals.glucoseTarget', 'Normal is 70–99 mg/dL')}
          </p>
        </>
      )}
    </section>
  )
}
