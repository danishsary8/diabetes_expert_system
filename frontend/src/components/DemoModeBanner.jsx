const demoMode = ['1', 'true', 'yes', 'on'].includes(
  String(import.meta.env.VITE_DEMO_MODE || '').trim().toLowerCase()
)

const demoLabel = String(import.meta.env.VITE_DEMO_LABEL || 'Independent Demo').trim()

export function DemoModeBanner() {
  if (!demoMode) return null

  return (
    <aside
      className="pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-2 z-[100] max-w-[calc(100vw-7.5rem)] truncate rounded-full border border-amber-300/80 bg-amber-50/95 px-2.5 py-1 text-center text-[10px] sm:bottom-3 sm:px-3 sm:py-1.5 sm:text-[11px] font-semibold sm:left-1/2 sm:max-w-none sm:-translate-x-1/2 text-amber-900 shadow-lg shadow-amber-950/10 backdrop-blur dark:border-amber-700/80 dark:bg-amber-950/90 dark:text-amber-100"
      aria-label="Demo environment notice"
    >
      {/* Phones get a short label so the pill never covers page content. */}
      <span className="sm:hidden">Demo · sample data</span>
      <span className="hidden sm:inline">{demoLabel} · synthetic sample data · not for medical diagnosis</span>
    </aside>
  )
}
