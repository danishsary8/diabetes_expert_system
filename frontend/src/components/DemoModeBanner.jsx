const demoMode = ['1', 'true', 'yes', 'on'].includes(
  String(import.meta.env.VITE_DEMO_MODE || '').trim().toLowerCase()
)

const demoLabel = String(import.meta.env.VITE_DEMO_LABEL || 'Independent Demo').trim()

export function DemoModeBanner() {
  if (!demoMode) return null

  return (
    <aside
      className="pointer-events-none fixed bottom-3 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-amber-300/80 bg-amber-50/95 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-900 shadow-lg shadow-amber-950/10 backdrop-blur dark:border-amber-700/80 dark:bg-amber-950/90 dark:text-amber-100"
      aria-label="Demo environment notice"
    >
      {demoLabel} · synthetic sample data · not for medical diagnosis
    </aside>
  )
}
