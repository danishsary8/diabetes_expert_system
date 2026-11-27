import { cn } from '@/lib/utils'

const toneIconStyles = {
  default: { chip: 'bg-slate-100', icon: 'text-slate-500' },
  primary: { chip: 'bg-primary-50', icon: 'text-primary-600' },
  success: { chip: 'bg-emerald-50', icon: 'text-emerald-600' },
  warning: { chip: 'bg-amber-50', icon: 'text-amber-600' },
  danger: { chip: 'bg-rose-50', icon: 'text-rose-600' },
}

// Colourful variant used on patient pages (opt-in via `vivid`).
const vividIconStyles = {
  default: 'from-sky-500 to-cyan-500 shadow-sky-500/30',
  primary: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  success: 'from-emerald-500 to-lime-500 shadow-emerald-500/30',
  warning: 'from-amber-400 to-orange-500 shadow-orange-500/30',
  danger: 'from-rose-500 to-orange-400 shadow-rose-500/30',
  indigo: 'from-indigo-500 to-sky-500 shadow-indigo-500/30',
}

export function StatCard({ label, value, hint, tone = 'default', icon: Icon, className, vivid = false, accent }) {
  const tones = toneIconStyles[tone] || toneIconStyles.default
  const vividTone = vividIconStyles[accent || tone] || vividIconStyles.default

  return (
    <article className={cn(vivid ? 'patient-card patient-card-hover min-w-0 p-4 sm:p-5' : 'surface min-w-0 p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {Icon ? (
          vivid ? (
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', vividTone)}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          ) : (
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tones.chip)}>
              <Icon className={cn('h-4 w-4', tones.icon)} aria-hidden />
            </span>
          )
        ) : null}
      </div>
      <p className={cn('mt-1.5 font-bold tracking-tight text-slate-900', vivid ? 'font-display text-3xl' : 'text-2xl')}>{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </article>
  )
}
