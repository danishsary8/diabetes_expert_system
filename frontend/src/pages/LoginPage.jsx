import { useMemo, useState, useEffect, useRef } from 'react'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, LogIn, Languages, ShieldCheck, Stethoscope } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage, setAuthTokens } from '../api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher'
import { AuthShowcasePanel } from '@/components/auth/AuthShowcasePanel'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const demoMode = ['1', 'true', 'yes', 'on'].includes(
  String(import.meta.env.VITE_DEMO_MODE || '').trim().toLowerCase()
)

export function LoginPage() {
  const { setUser, loginWithGoogle } = useAuth()
  const { language, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: demoMode ? 'doctor@example.com' : '',
    password: demoMode ? 'doctor123' : '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const transitionDirection = location.state?.authTransition
  const formAnimationClass =
    transitionDirection === 'to-login'
      ? 'auth-anim-to-login'
      : transitionDirection === 'to-register'
      ? 'auth-anim-to-register'
      : 'auth-anim-default'



  const isValid = useMemo(
    () => Boolean(formData.email.trim() && formData.password.trim()),
    [formData.email, formData.password]
  )

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) {
      setError(t('auth.errorEmailPasswordRequired', 'Email and password are required.'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      })
      const data = getApiData(response)
      setAuthTokens(data.access_token || data.token, data.refresh_token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorLoginFailed', 'Login failed')))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(tokenOrCredential) {
    const token = tokenOrCredential?.access_token || tokenOrCredential?.credential || tokenOrCredential
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const user = await loginWithGoogle(token)
      if (user?.role === 'patient' && !user?.profile_completed) {
        navigate('/profile-setup')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorGoogleLoginFailed', 'Google sign-in failed. Please try again.')))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleError(err) {
    console.error('Google login error:', err)
    setError(t('auth.errorGoogleLoginFailed', 'Google sign-in failed. Please try again.'))
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-teal-500/20">
      <style>{`


        html[lang='km'] .auth-heading {
          line-height: 1.4;
        }

        @keyframes authSlideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-36px) scale(0.985);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes authSlideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(36px) scale(0.985);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes authFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.99);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .auth-anim-to-login {
          animation: authSlideInFromLeft 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity, filter;
        }

        .auth-anim-to-register {
          animation: authSlideInFromRight 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity, filter;
        }

        .auth-anim-default {
          animation: authFadeInUp 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity, filter;
        }

        @media (min-height: 600px) {
          .auth-form-column {
            overflow-y: auto !important;
          }
        }
      `}</style>

      {/* ── LEFT HALF: Sign In Form ── */}
      <div className="auth-form-column w-full lg:w-1/2 h-full max-h-[100dvh] flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 relative overflow-y-auto auth-form-bg">
        {/* Header bar: Logo & Language Switcher */}
        <div className="flex items-center justify-between gap-4 w-full shrink-0">
          <Link to="/" className="inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90">
            <img
              src="/images/logo.png"
              alt="Diabetes Expert System Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1"
                style={{ fontFamily: 'var(--font-latin-display)' }}
              >
                Diabetes Expert System
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                {language === 'km' ? 'ប្រព័ន្ធជំនាញគ្លីនិក v3.0' : 'Clinical Decision Support v3.0'}
              </span>
            </div>
          </Link>

          <LanguageSwitcher />
        </div>

        {/* Center Form Container */}
        <div className={`w-full max-w-[440px] mx-auto my-auto py-4 ${formAnimationClass}`}>
          <div className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-2xl shadow-slate-900/[0.08] ring-1 ring-slate-900/[0.03] backdrop-blur-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900/85 dark:ring-white/5">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30" aria-hidden="true">
            <LogIn className="h-5 w-5" />
          </span>

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/60 text-[11px] font-semibold text-teal-700 dark:text-teal-300 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
            <span>{t('auth.accentEyebrow', 'Diabetes Expert System')}</span>
          </div>

          <h1
            className="auth-heading text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight"
            style={{ fontFamily: 'var(--font-latin-display)' }}
          >
            {t('auth.loginPageTitle', 'Sign In')}
          </h1>
          <p
            className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 mb-3.5"
            style={{ fontFamily: 'var(--font-latin-sans)' }}
          >
            {t('auth.loginPageSub', 'Sign in to continue to your clinical dashboard.')}
          </p>

          {demoMode ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <span className="font-bold">Independent demo:</span>{' '}
              sample doctor credentials are prefilled. All records in this environment must use the separate demo database.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3" style={{ fontFamily: 'var(--font-latin-sans)' }}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                {t('auth.emailLabel', 'Email')}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-3.5 min-h-12 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:border-teal-500 transition-all"
                  placeholder={t('auth.emailPlaceholder', 'Email address')}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                {t('auth.passwordLabel', 'Password')}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <LockKeyhole size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-10 min-h-12 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 focus:border-teal-500 transition-all"
                  placeholder={t('auth.passwordPlaceholder', 'Password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 accent-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-[12px]">{t('auth.rememberMe', 'Remember me')}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="group w-full min-h-12 py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/35 hover:brightness-105 active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 motion-reduce:hover:translate-y-0"
              style={{ fontFamily: 'var(--font-latin-display)' }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.signingIn', 'Signing in...')}</span>
                </>
              ) : (
                <span>{t('auth.login', 'Sign In')}</span>
              )}
            </button>

            {/* Google OAuth Login Button */}
            {googleClientId ? (
              <>
                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
                  </div>
                  <div className="relative rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {t('auth.orDivider', 'OR')}
                  </div>
                </div>

                <GoogleAuthButton
                  mode="signin"
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={loading}
                />
              </>
            ) : null}

            {/* Error Display */}
            {error ? (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Bottom Link to Sign Up */}
            <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('auth.noAccount', "Don't have an account?")}{' '}
              <Link
                to="/sign-up"
                state={{ authTransition: 'to-register' }}
                className="font-bold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200 hover:underline ml-1"
              >
                {t('auth.signUp', 'Create Account')}
              </Link>
            </p>
          </form>
          </div>

          {/* Trust badges */}
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              {t('auth.trustSecure', 'Private & secure')}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-700">
              <Languages className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              {t('auth.trustBilingual', 'English & ខ្មែរ')}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-700">
              <Stethoscope className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" aria-hidden="true" />
              {t('auth.trustReviewed', 'Reviewed by doctors')}
            </li>
          </ul>
        </div>

        {/* Footer: Disclaimer / Status */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-1.5 shrink-0">
          <span>© 2026 Diabetes Decision Support System</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'km' ? 'ប្រព័ន្ធដំណើរការធម្មតា' : 'System Operational'}</span>
          </span>
        </div>
      </div>

      {/* ── RIGHT HALF: High-Impact Showcase of System ── */}
      <AuthShowcasePanel />
    </div>
  )
}
