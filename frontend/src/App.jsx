import { useEffect } from 'react'
import { AppRouter } from './app/router'
// Import directly (not via the ui barrel) so recharts — pulled in by
// ui/chart.jsx through the barrel — stays out of the eagerly-loaded entry chunk.
import { Toaster } from '@/components/ui/sonner'
import { DiabetesAssistant } from '@/features/diabetes-assistant/DiabetesAssistant'
import { DemoModeBanner } from '@/components/DemoModeBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleAccess } from '@/hooks/useRoleAccess'

function App() {
  const { user } = useAuth()
  const { isPatient, canViewPatients } = useRoleAccess(user)
  const showPatientAssistant = Boolean(user) && isPatient && !canViewPatients
  const isPatientExperience = Boolean(user) && isPatient && !canViewPatients

  // Patient accounts get their own palette and typography (see styles/app.css).
  // Applied during render (idempotent) so the very first paint of a patient
  // page — including chart colours read from CSS — already uses the theme.
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (isPatientExperience) root.dataset.audience = 'patient'
    else delete root.dataset.audience
  }
  useEffect(() => () => {
    delete document.documentElement.dataset.audience
  }, [])

  return (
    <>
      <AppRouter />
      <DemoModeBanner />
      {showPatientAssistant && <DiabetesAssistant />}
      <Toaster richColors />
    </>
  )
}

export default App
