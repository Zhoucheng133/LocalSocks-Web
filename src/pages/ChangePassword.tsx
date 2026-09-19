import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { requestWithToken, store, tokenAtom } from '../utils/requests'

export default function ChangePassword() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setShowLangMenu(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('changePassword.errorFill'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.errorMismatch'))
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const response = await requestWithToken({
        method: 'POST',
        url: '/api/user/edit',
        data: {
          oldPassword,
          newPassword,
          confirmPassword,
        },
      })
      if (response.ok) {
        setSuccess(t('changePassword.successMessage'))
        setTimeout(() => {
          localStorage.removeItem('token')
          store.set(tokenAtom, '')
          navigate('/login', { replace: true })
        }, 1500)
      } else {
        setError(String(response.data))
      }
    } catch {
      setError(t('changePassword.errorFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-indigo-50 to-blue-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      {/* Language Switcher Button on Top Right */}
      <div className="absolute top-6 right-6" ref={langMenuRef}>
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Select Language"
        >
          <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '14px' }} />
          <span>{i18n.language === 'zh_CN' ? '简体中文' : i18n.language === 'zh_TW' ? '繁體中文' : 'English'}</span>
        </button>

        {showLangMenu && (
          <div className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => changeLanguage('zh_CN')}
              className={`w-full px-4 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                i18n.language === 'zh_CN' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              简体中文
            </button>
            <button
              onClick={() => changeLanguage('zh_TW')}
              className={`w-full px-4 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                i18n.language === 'zh_TW' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              繁體中文
            </button>
            <button
              onClick={() => changeLanguage('en_US')}
              className={`w-full px-4 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                i18n.language === 'en_US' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              English
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              {t('changePassword.back')}
            </button>
            <img src="/icon.svg" className="flex h-8 w-8" draggable={false} />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{t('changePassword.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('changePassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">{success}</div>
            )}

            <div>
              <label htmlFor="old-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('changePassword.oldPassword')}
              </label>
              <input
                id="old-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('changePassword.newPassword')}
              </label>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('changePassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:outline-none active:bg-indigo-700 disabled:opacity-60 dark:shadow-indigo-950/50 dark:focus:ring-indigo-400/40 dark:focus:ring-offset-slate-900"
            >
              {loading ? t('common.loading') : t('changePassword.submitButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
