import { cn } from '@/lib/utils'

/*
 * RangeRibbon — the patient experience's signature element.
 * A horizontal band split into clinical zones (low / in range / watch / high)
 * with a marker showing where a reading sits. Used large in the dashboard hero
 * and small inside each vital card, so every number is read against its range.
 */

const TONE_LIGHT = {
  low: 'bg-rose-300',
  good: 'bg-emerald-400',
  watch: 'bg-amber-300',
  high: 'bg-rose-400',
}

const TONE_ON_DARK = {
  low: 'bg-rose-300/80',
  good: 'bg-emerald-300',
  watch: 'bg-amber-300',
  high: 'bg-rose-300',
}

export const RANGE_PRESETS = {
  fastingGlucose: {
    min: 50,
    max: 200,
    unit: 'mg/dL',
    segments: [
      { to: 70, tone: 'low', label: 'Low' },
      { to: 100, tone: 'good', label: 'Normal' },
      { to: 126, tone: 'watch', label: 'Elevated' },
      { to: 200, tone: 'high', label: 'High' },
    ],
  },
  hba1c: {
    min: 4,
    max: 10,
    unit: '%',
    segments: [
      { to: 5.7, tone: 'good', label: 'Normal' },
      { to: 6.5, tone: 'watch', label: 'Prediabetes' },
      { to: 10, tone: 'high', label: 'Diabetes range' },
    ],
  },
  waistMale: {
    min: 70,
    max: 130,
    unit: 'cm',
    segments: [
      { to: 94, tone: 'good', label: 'Lower risk' },
      { to: 102, tone: 'watch', label: 'Increased' },
      { to: 130, tone: 'high', label: 'High' },
    ],
  },
  waistFemale: {
    min: 60,
    max: 120,
    unit: 'cm',
    segments: [
      { to: 80, tone: 'good', label: 'Lower risk' },
      { to: 88, tone: 'watch', label: 'Increased' },
      { to: 120, tone: 'high', label: 'High' },
    ],
  },
  bmi: {
    min: 15,
    max: 40,
    unit: 'kg/m²',
    segments: [
      { to: 18.5, tone: 'low', label: 'Under' },
      { to: 25, tone: 'good', label: 'Healthy' },
      { to: 30, tone: 'watch', label: 'Over' },
      { to: 40, tone: 'high', label: 'Obese' },
    ],
  },
}

/** Returns the segment a value falls in for a preset. */
export function getRangeSegment(preset, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null
  return preset.segments.find((segment) => value < segment.to) || preset.segments[preset.segments.length - 1]
}

export function RangeRibbon({
  preset,
  value,
  size = 'sm',
  onDark = false,
  showLabels = false,
  translateLabel = (label) => label,
  className,
}) {
  const { min, max, segments } = preset
  const span = max - min
  const clamped = value === null || value === undefined ? null : Math.min(max, Math.max(min, Number(value)))
  const position = clamped === null ? null : ((clamped - min) / span) * 100
  const tones = onDark ? TONE_ON_DARK : TONE_LIGHT
  const isLarge = size === 'lg'

  let previous = min
  const parts = segments.map((segment) => {
    const width = ((Math.min(segment.to, max) - previous) / span) * 100
    previous = segment.to
    return { ...segment, width }
  })

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('relative', isLarge ? 'pt-1' : '')}>
        <div className={cn('flex w-full overflow-hidden rounded-full', isLarge ? 'h-3 gap-[3px]' : 'h-1.5 gap-[2px]')}>
          {parts.map((part) => (
            <span
              key={part.label}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', tones[part.tone])}
              style={{ width: `${part.width}%` }}
            />
          ))}
        </div>

        {position !== null && (
          <span
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          >
            <span
              className={cn(
                'block rounded-full',
                isLarge
                  ? 'h-6 w-6 border-[5px] border-white bg-navy-deep shadow-[0_2px_10px_rgba(0,0,0,0.35)] dark:border-white'
                  : 'h-3.5 w-3.5 border-[3px] border-white bg-slate-900 shadow-sm dark:border-night-surface dark:bg-white'
              )}
            />
          </span>
        )}
      </div>

      {showLabels && (
        <div className={cn('mt-2 flex w-full text-[11px]', isLarge && 'sm:text-xs')}>
          {parts.map((part) => (
            <span
              key={part.label}
              className={cn('truncate pr-0.5', onDark ? 'text-white/65' : 'text-slate-500 dark:text-slate-400')}
              style={{ width: `${part.width}%` }}
            >
              {translateLabel(part.label)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
