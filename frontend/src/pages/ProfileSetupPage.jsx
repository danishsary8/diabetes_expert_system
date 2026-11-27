import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  ArrowRight,
  Cake,
  CalendarDays,
  Check,
  Cigarette,
  Droplets,
  HeartPulse,
  Loader2,
  Mars,
  Ruler,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Venus,
  VenusAndMars,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher'
import { cn } from '@/lib/utils'

const NS = 'profileSetup'
const TOTAL_STEPS = 3

const GENDER_OPTIONS = [
  { value: 'male', labelKey: `${NS}.genderMale`, fallback: 'Male', icon: Mars, tone: 'text-sky-600 bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60' },
  { value: 'female', labelKey: `${NS}.genderFemale`, fallback: 'Female', icon: Venus, tone: 'text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60' },
  { value: 'other', labelKey: `${NS}.genderOther`, fallback: 'Other', icon: VenusAndMars, tone: 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60' },
]

const RISK_PILLS = [
  { key: 'family_history', labelKey: `${NS}.riskFamily`, fallback: 'Family history of diabetes', icon: Users, tone: 'text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/60' },
  { key: 'hypertension', labelKey: `${NS}.riskHypertension`, fallback: 'High blood pressure', icon: HeartPulse, tone: 'text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/60' },
  { key: 'high_cholesterol', labelKey: `${NS}.riskCholesterol`, fallback: 'High cholesterol', icon: Droplets, tone: 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60' },
  { key: 'smoking', labelKey: `${NS}.riskSmoking`, fallback: 'I smoke', icon: Cigarette, tone: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-950/60' },
  { key: 'sedentary_lifestyle', labelKey: `${NS}.riskSedentary`, fallback: 'Mostly sedentary lifestyle', icon: Armchair, tone: 'text-sky-600 bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60' },
]

// Each step gets its own accent so the journey feels like it is moving forward.
const STEP_META = [
  { icon: UserRound, gradient: 'from-cyan-500 to-teal-600', glow: 'shadow-cyan-500/30' },
  { icon: Ruler, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
  { icon: HeartPulse, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-orange-500/30' },
]

// BMI scale shown under the measurements (WHO adult cut-offs).
const BMI_MIN = 15
const BMI_MAX = 40
const BMI_BANDS = [
  { upTo: 18.5, key: 'bmiUnder', fallback: 'Underweight', bar: 'bg-sky-400', text: 'text-sky-700 dark:text-sky-300', chip: 'bg-sky-100 dark:bg-sky-950/60' },
  { upTo: 25, key: 'bmiHealthy', fallback: 'Healthy', bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-100 dark:bg-emerald-950/60' },
  { upTo: 30, key: 'bmiOver', fallback: 'Overweight', bar: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-300', chip: 'bg-amber-100 dark:bg-amber-950/60' },
  { upTo: Infinity, key: 'bmiObese', fallback: 'Obese', bar: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', chip: 'bg-rose-100 dark:bg-rose-950/60' },
]

const fieldLabel = 'text-sm font-semibold text-slate-700 dark:text-slate-200'
const fieldInput = 'peer min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:ring-primary-400/20'
const focusRing = 'outline-none focus-visible:ring-4 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900'

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
  return age >= 0 && age < 130 ? age : null
}

function computeBmi(heightCm, weightKg) {
  const h = Number(heightCm)
  const w = Number(weightKg)
  if (!h || !w || h <= 0 || w <= 0) return null
  const bmi = w / ((h / 100) * (h / 100))
  return bmi > 0 && bmi < 200 ? Math.round(bmi * 10) / 10 : null
}

function bmiBand(bmi) {
  return BMI_BANDS.find((band) => bmi < band.upTo) || BMI_BANDS[BMI_BANDS.length - 1]
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

/** Vertical stepper for the colourful side panel (desktop). */
function SideStepper({ step, titles, t }) {
  return (
    <ol className="relative space-y-1" aria-label={t(`${NS}.stepProgress`, 'Step {{current}} of {{total}}', { current: step, total: TOTAL_STEPS })}>
      {titles.map((title, index) => {
        const s = index + 1
        const done = s < step
        const current = s === step
        const Icon = STEP_META[index].icon
        return (
          <li key={title} className="relative flex items-center gap-4 rounded-2xl px-3 py-3" aria-current={current ? 'step' : undefined}>
            {s < TOTAL_STEPS ? (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[2.15rem] top-[3.4rem] h-[calc(100%-2.6rem)] w-0.5 rounded-full transition-colors duration-500',
                  done ? 'bg-[#fff]' : 'bg-white/25'
                )}
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
                done && 'bg-[#fff] text-teal-700',
                current && 'bg-[#fff] text-teal-700 shadow-lg shadow-teal-950/20 ring-4 ring-white/30',
                !done && !current && 'bg-white/15 text-white/80'
              )}
            >
              {done ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className={cn('block truncate text-[15px] font-semibold', current || done ? 'text-white' : 'text-white/75')}>{title}</span>
              <span className="block text-xs font-medium text-white/70">
                {done
                  ? t(`${NS}.statusDone`, 'Completed')
                  : current
                    ? t(`${NS}.statusCurrent`, 'In progress')
                    : t(`${NS}.statusNext`, 'Up next')}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Compact segmented progress for small screens. */
function MobileStepper({ step, titles }) {
  return (
    <div className="lg:hidden" aria-hidden>
      <div className="grid grid-cols-3 gap-2">
        {titles.map((title, index) => {
          const s = index + 1
          return (
            <div key={title} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out',
                    STEP_META[index].gradient,
                    s <= step ? 'w-full' : 'w-0'
                  )}
                />
              </div>
              <p className={cn('mt-2 truncate text-xs font-semibold', s === step ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500')}>
                {title}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Live summary (side panel)                                           */
/* ------------------------------------------------------------------ */

function SummaryRow({ label, value }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-white/75">{label}</dt>
      <dd className={cn('truncate text-sm font-semibold', empty ? 'text-white/45' : 'text-white')}>{empty ? '—' : value}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function ProfileSetupPage() {
  const { user, setUser, refreshUser } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const headingRef = useRef(null)
  const shownStep = useRef(step)

  // This page renders outside AppLayout, which normally applies the saved
  // light / dark preference, so apply it here too.
  useEffect(() => {
    // Light by default; dark only when the user has chosen it.
    document.documentElement.classList.toggle('dark', window.localStorage.getItem('app-theme') === 'dark')
  }, [])
  const [profile, setProfile] = useState({
    gender: '',
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    waist_circumference: '',
    family_history: false,
    hypertension: false,
    high_cholesterol: false,
    smoking: false,
    sedentary_lifestyle: false,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const age = useMemo(() => computeAge(profile.date_of_birth), [profile.date_of_birth])
  const bmi = useMemo(() => computeBmi(profile.height_cm, profile.weight_kg), [profile.height_cm, profile.weight_kg])
  const riskCount = RISK_PILLS.filter((pill) => profile[pill.key]).length

  const update = (patch) => setProfile((current) => ({ ...current, ...patch }))

  // Move focus to the new step's heading so keyboard and screen-reader users
  // land at the top of the freshly rendered step.
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // Returning to the wizard after a previous attempt? Restore whatever was
  // already saved so nothing gets typed twice, and skip straight to the
  // dashboard when the profile was actually completed.
  useEffect(() => {
    let cancelled = false
    api.get('/patients/mine')
      .then((response) => {
        const saved = getApiData(response)
        if (cancelled || !saved) return
        if (saved.profile_completed_at) {
          navigate('/dashboard', { replace: true })
          return
        }
        setProfile((current) => ({
          ...current,
          gender: saved.gender && saved.gender !== 'unknown' ? saved.gender : current.gender,
          date_of_birth: saved.date_of_birth ? String(saved.date_of_birth).slice(0, 10) : current.date_of_birth,
          height_cm: saved.height_cm ?? current.height_cm,
          weight_kg: saved.weight_kg ?? current.weight_kg,
          waist_circumference: saved.waist_circumference ?? current.waist_circumference,
          family_history: Boolean(saved.family_history),
          hypertension: Boolean(saved.hypertension),
          high_cholesterol: Boolean(saved.high_cholesterol),
          smoking: Boolean(saved.smoking),
          sedentary_lifestyle: Boolean(saved.sedentary_lifestyle),
        }))
      })
      .catch(() => { /* offline — the wizard still works with blank defaults */ })
    return () => { cancelled = true }
  }, [])

  function validateStep(current) {
    if (current === 1) {
      if (!profile.gender) return t(`${NS}.errors.gender`, 'Please choose a gender option.')
      if (!profile.date_of_birth) return t(`${NS}.errors.dob`, 'Please enter your date of birth.')
      if (age === null || age < 1 || age > 120) return t(`${NS}.errors.dobRange`, 'Please enter a valid date of birth.')
    }
    if (current === 2) {
      const h = Number(profile.height_cm)
      const w = Number(profile.weight_kg)
      if (!profile.height_cm || h < 80 || h > 250) return t(`${NS}.errors.height`, 'Please enter a height between 80 and 250 cm.')
      if (!profile.weight_kg || w < 20 || w > 400) return t(`${NS}.errors.weight`, 'Please enter a weight between 20 and 400 kg.')
      const waist = Number(profile.waist_circumference)
      if (profile.waist_circumference && (waist < 40 || waist > 200)) return t(`${NS}.errors.waist`, 'Please enter a waist between 40 and 200 cm.')
    }
    return ''
  }

  function goNext() {
    const message = validateStep(step)
    if (message) { setError(message); return }
    setError('')
    setStep((current) => Math.min(TOTAL_STEPS, current + 1))
  }

  function goBack() {
    setError('')
    setStep((current) => Math.max(1, current - 1))
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      await api.patch('/patients/mine', {
        gender: profile.gender,
        date_of_birth: profile.date_of_birth || null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        waist_circumference: profile.waist_circumference ? Number(profile.waist_circumference) : null,
        smoking: profile.smoking,
        sedentary_lifestyle: profile.sedentary_lifestyle,
        family_history: profile.family_history,
        hypertension: profile.hypertension,
        high_cholesterol: profile.high_cholesterol,
        profile_complete: true,
      })
      // The save is durable — flip the flag optimistically so the profile
      // gate lets us through even if the refetch below hiccups.
      setUser((current) => ({ ...(current || {}), profile_completed: true }))
      try {
        await refreshUser()
      } catch {
        // A stale-but-flagged user is good enough to reach the dashboard.
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, t(`${NS}.errors.save`, 'Could not save your profile. Please try again.')))
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    if (step < TOTAL_STEPS) goNext()
    else handleFinish()
  }

  const stepTitles = [
    t(`${NS}.step1.title`, 'About you'),
    t(`${NS}.step2.title`, 'Your body'),
    t(`${NS}.step3.title`, 'Health background'),
  ]
  const stepDescriptions = [
    t(`${NS}.step1.description`, 'Two quick details so your assessments start pre-filled.'),
    t(`${NS}.step2.description`, 'Used to calculate your BMI automatically — no need to type it later.'),
    t(`${NS}.step3.description`, 'Optional — these feed the risk analysis only if they apply to you.'),
  ]

  const meta = STEP_META[step - 1]
  const StepIcon = meta.icon
  const firstName = (user?.name || '').split(' ')[0]
  const genderOption = GENDER_OPTIONS.find((option) => option.value === profile.gender)
  const band = bmi !== null ? bmiBand(bmi) : null
  const bmiPosition = bmi !== null ? Math.min(100, Math.max(0, ((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100)) : null

  const primaryButtonClass = cn(
    'group inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-teal-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    focusRing
  )

  return (
    <div className="relative min-h-screen overflow-clip bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Ambient colour */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(15_23_42/0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] dark:bg-[radial-gradient(rgb(255_255_255/0.05)_1px,transparent_1px)]" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/30">
            <Sparkles className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t(`${NS}.brandTag`, 'Health profile setup')}
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pt-10">
        {/* ---------- Colourful side panel (desktop) ---------- */}
        <aside className="relative hidden overflow-hidden rounded-[28px] bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-600 p-7 text-white shadow-2xl shadow-teal-900/20 lg:flex lg:flex-col">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-2xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              {t(`${NS}.stepProgress`, 'Step {{current}} of {{total}}', { current: step, total: TOTAL_STEPS })}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold leading-tight [text-wrap:balance]">
              {t(`${NS}.panelTitle`, 'Your assessments, personalised from the start')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {t(`${NS}.footnote`, 'These answers replace the profile questions inside every assessment — less typing, more accuracy.')}
            </p>
          </div>

          <div className="relative mt-7">
            <SideStepper step={step} titles={stepTitles} t={t} />
          </div>

          <div className="relative mt-auto pt-7">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                {t(`${NS}.summaryTitle`, 'Your profile so far')}
              </p>
              <dl className="mt-1 divide-y divide-white/15">
                <SummaryRow label={t(`${NS}.genderLabel`, 'Gender')} value={genderOption ? t(genderOption.labelKey, genderOption.fallback) : null} />
                <SummaryRow label={t(`${NS}.summaryAge`, 'Age')} value={age !== null ? t(`${NS}.agePreview`, '{{age}} years old', { age }) : null} />
                <SummaryRow label={t(`${NS}.summaryBmi`, 'BMI')} value={bmi !== null ? `${bmi} · ${t(`${NS}.${band.key}`, band.fallback)}` : null} />
                <SummaryRow label={t(`${NS}.summaryRisks`, 'Risk factors')} value={step === 3 || riskCount > 0 ? String(riskCount) : null} />
              </dl>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/75">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t(`${NS}.privacyNote`, 'Only you and your care team can see this. You can change it anytime in your profile.')}
            </p>
          </div>
        </aside>

        {/* ---------- Form card ---------- */}
        <section className="relative">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="relative flex h-full flex-col rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-900/[0.07] ring-1 ring-slate-900/[0.03] backdrop-blur-xl sm:p-9 dark:border-slate-800 dark:bg-slate-900/85 dark:ring-white/5"
          >
            <MobileStepper step={step} titles={stepTitles} />

            {/* Step header */}
            <div className="mt-6 flex items-start gap-4 lg:mt-0">
              <span
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-all duration-300',
                  meta.gradient,
                  meta.glow
                )}
              >
                <StepIcon className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
                  {t(`${NS}.stepLabel`, 'Step {{current}}/{{total}}', { current: step, total: TOTAL_STEPS })}
                </p>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 outline-none focus:outline-none focus-visible:outline-none sm:text-[28px] dark:text-slate-50"
                >
                  {stepTitles[step - 1]}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(`${NS}.welcome`, 'Hi {{name}} — let’s set up your health profile.', { name: firstName })}
                </p>
              </div>
            </div>

            <p className="mt-6 flex items-start gap-2.5 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-cyan-50/60 px-4 py-3 text-sm leading-6 text-primary-900 dark:border-primary-900/50 dark:from-primary-950/40 dark:to-cyan-950/20 dark:text-primary-100">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
              {stepDescriptions[step - 1]}
            </p>

            {/* Step body — keyed so each step animates in */}
            <div key={step} className="mt-7 flex-1 animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none">
              {/* Step 1: About you */}
              {step === 1 ? (
                <div className="space-y-7">
                  <fieldset>
                    <legend className={fieldLabel}>{t(`${NS}.genderLabel`, 'Gender')}</legend>
                    <div className="mt-3 grid grid-cols-3 gap-3" role="radiogroup">
                      {GENDER_OPTIONS.map((option) => {
                        const selected = profile.gender === option.value
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => update({ gender: option.value })}
                            className={cn(
                              'relative flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 px-2 py-4 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none',
                              focusRing,
                              selected
                                ? 'border-primary-500 bg-primary-50/80 text-primary-800 shadow-md shadow-primary-500/10 dark:border-primary-400 dark:bg-primary-950/40 dark:text-primary-100'
                                : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
                            )}
                          >
                            <span className={cn('flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200', option.tone, selected && 'scale-110')}>
                              <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            {t(option.labelKey, option.fallback)}
                            <span
                              aria-hidden
                              className={cn(
                                'absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white transition-all duration-200',
                                selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                              )}
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="dob" className={fieldLabel}>{t(`${NS}.dobLabel`, 'Date of birth')}</label>
                    <div className="relative mt-3">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
                      <input
                        id="dob"
                        type="date"
                        value={profile.date_of_birth}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(event) => update({ date_of_birth: event.target.value })}
                        className={cn(fieldInput, 'pl-12')}
                        aria-describedby={age !== null ? 'dob-age' : undefined}
                      />
                    </div>
                    {age !== null ? (
                      <p id="dob-age" className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800 animate-in fade-in zoom-in-95 duration-200 dark:bg-emerald-950/50 dark:text-emerald-200">
                        <Cake className="h-4 w-4" aria-hidden />
                        {t(`${NS}.agePreview`, '{{age}} years old', { age })}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Step 2: Body metrics */}
              {step === 2 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MeasureField
                      id="height"
                      label={t(`${NS}.heightLabel`, 'Height (cm)')}
                      unit={t(`${NS}.unitCm`, 'cm')}
                      min="80"
                      max="250"
                      placeholder="170"
                      value={profile.height_cm}
                      onChange={(value) => update({ height_cm: value })}
                    />
                    <MeasureField
                      id="weight"
                      label={t(`${NS}.weightLabel`, 'Weight (kg)')}
                      unit={t(`${NS}.unitKg`, 'kg')}
                      min="20"
                      max="400"
                      placeholder="65"
                      value={profile.weight_kg}
                      onChange={(value) => update({ weight_kg: value })}
                    />
                  </div>

                  {/* BMI gauge */}
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/60" aria-live="polite">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t(`${NS}.bmiTitle`, 'Body Mass Index')}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {bmi !== null
                            ? t(`${NS}.bmiAuto`, 'Calculated automatically in every assessment.')
                            : t(`${NS}.bmiEmpty`, 'Enter your height and weight to see it here.')}
                        </p>
                      </div>
                      {bmi !== null ? (
                        <div className="text-right">
                          <p className="font-display text-3xl font-bold tabular-nums text-slate-950 dark:text-white">{bmi}</p>
                          <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', band.chip, band.text)}>
                            {t(`${NS}.${band.key}`, band.fallback)}
                          </span>
                        </div>
                      ) : (
                        <p className="font-display text-3xl font-bold text-slate-300 dark:text-slate-600">—</p>
                      )}
                    </div>
                    <div className="relative mt-5">
                      <div className="flex h-2.5 overflow-hidden rounded-full">
                        {BMI_BANDS.map((b, index) => {
                          const lower = index === 0 ? BMI_MIN : BMI_BANDS[index - 1].upTo
                          const upper = Math.min(b.upTo, BMI_MAX)
                          return (
                            <span
                              key={b.key}
                              className={cn(b.bar, 'h-full transition-opacity duration-300', band && band.key !== b.key && 'opacity-35')}
                              style={{ width: `${((upper - lower) / (BMI_MAX - BMI_MIN)) * 100}%` }}
                            />
                          )
                        })}
                      </div>
                      {bmiPosition !== null ? (
                        <span
                          aria-hidden
                          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-slate-900 shadow-md transition-[left] duration-500 ease-out dark:border-slate-900 dark:bg-white"
                          style={{ left: `${bmiPosition}%` }}
                        />
                      ) : null}
                      <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400 tabular-nums">
                        <span>{BMI_MIN}</span><span>18.5</span><span>25</span><span>30</span><span>{BMI_MAX}+</span>
                      </div>
                    </div>
                  </div>

                  <MeasureField
                    id="waist"
                    label={(
                      <>
                        {t(`${NS}.waistLabel`, 'Waist (cm)')}{' '}
                        <span className="font-normal text-slate-400">({t(`${NS}.optional`, 'optional')})</span>
                      </>
                    )}
                    unit={t(`${NS}.unitCm`, 'cm')}
                    min="40"
                    max="200"
                    placeholder="80"
                    value={profile.waist_circumference}
                    onChange={(value) => update({ waist_circumference: value })}
                  />
                </div>
              ) : null}

              {/* Step 3: Health background */}
              {step === 3 ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className={fieldLabel}>{t(`${NS}.riskPrompt`, 'Tap everything that applies to you')}</p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                        riskCount > 0 ? 'bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      )}
                      aria-live="polite"
                    >
                      {riskCount > 0
                        ? t(`${NS}.riskSelected`, '{{count}} selected', { count: riskCount })
                        : t(`${NS}.riskNone`, 'None selected')}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {RISK_PILLS.map((pill) => {
                      const active = profile[pill.key]
                      const Icon = pill.icon
                      return (
                        <button
                          key={pill.key}
                          type="button"
                          onClick={() => update({ [pill.key]: !active })}
                          aria-pressed={active}
                          className={cn(
                            'flex min-h-16 cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all duration-200 motion-reduce:transition-none',
                            focusRing,
                            active
                              ? 'border-primary-500 bg-primary-50/80 text-primary-900 shadow-md shadow-primary-500/10 dark:border-primary-400 dark:bg-primary-950/40 dark:text-primary-100'
                              : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
                          )}
                        >
                          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', pill.tone)}>
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">{t(pill.labelKey, pill.fallback)}</span>
                          <span
                            aria-hidden
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
                              active ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 text-transparent dark:border-slate-600'
                            )}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 lg:hidden dark:bg-slate-800/60 dark:text-slate-300">
                    <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {t(`${NS}.privacyNote`, 'Only you and your care team can see this. You can change it anytime in your profile.')}
                  </p>
                </div>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className={cn(
                    'inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                    focusRing
                  )}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  {t(`${NS}.back`, 'Back')}
                </button>
              ) : (
                <span />
              )}

              {step < TOTAL_STEPS ? (
                <button type="submit" className={primaryButtonClass}>
                  {t(`${NS}.continue`, 'Continue')}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </button>
              ) : (
                <button type="submit" disabled={saving} className={primaryButtonClass}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                  {saving ? t(`${NS}.saving`, 'Saving...') : t(`${NS}.finish`, 'Finish setup')}
                </button>
              )}
            </div>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500 lg:hidden dark:text-slate-400">
            {t(`${NS}.footnote`, 'These answers replace the profile questions inside every assessment — less typing, more accuracy.')}
          </p>
        </section>
      </main>
    </div>
  )
}

function MeasureField({ id, label, unit, min, max, placeholder, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <div className="relative mt-3">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(fieldInput, 'pr-14 text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none')}
          placeholder={placeholder}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 peer-focus:bg-primary-100 peer-focus:text-primary-700 dark:bg-slate-800 dark:text-slate-400 dark:peer-focus:bg-primary-950/60 dark:peer-focus:text-primary-300">
          {unit}
        </span>
      </div>
    </div>
  )
}
