import { Activity, BookOpen, Bot } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function AuthShowcasePanel() {
  const { t } = useLanguage()
  const highlights = [
    { icon: Activity, label: t('auth.showcaseRisk', 'Risk check in 5 minutes'), tone: 'from-rose-500 to-orange-400' },
    { icon: Bot, label: t('auth.showcaseAssistant', 'Friendly diabetes assistant'), tone: 'from-teal-500 to-cyan-500' },
    { icon: BookOpen, label: t('auth.showcaseGuide', 'Guides you can trust'), tone: 'from-indigo-500 to-sky-500' },
  ]

  return (
    <aside
      className="hidden lg:flex lg:w-1/2 relative h-full max-h-[100dvh] overflow-hidden bg-slate-950 items-center justify-center select-none"
      aria-label="Diabetes Expert System Showcase"
    >
      <img
        src="/images/auth-system-showcase.png"
        alt="Diabetes Expert System Clinical Decision Support"
        className="w-full h-full object-cover object-center"
        loading="eager"
      />

      {/* Brand tint and caption */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-900/10 to-transparent" />
      <div className="absolute inset-x-8 bottom-6 xl:inset-x-12 xl:bottom-8">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl ">
          <h2 className="font-display text-xl font-bold leading-tight [text-wrap:balance] xl:text-2xl">
            {t('auth.showcaseTitle', 'Smarter diabetes care, in your language')}
          </h2>
          <p className="mt-1.5 max-w-lg text-sm leading-6 text-white/80">
            {t('auth.showcaseCopy', 'Check your risk, follow a personal care plan and ask questions any time — with doctors in the loop.')}
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-2.5">
            {highlights.map(({ icon: Icon, label, tone }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-2xl bg-white/10 p-2.5 ring-1 ring-inset ring-white/15">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`}>
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold leading-snug">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
