import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faTrash,
  faPen,
  faFileArrowDown,
  faFingerprint,
  faPlay,
  faArrowsRotate,
  faStop,
  faSliders
} from '@fortawesome/free-solid-svg-icons'
import type { Server } from '../utils/types'
import { requestWithToken, store, tokenAtom } from '../utils/requests'

interface ServerForm {
  name: string
  username: string
  password: string
  host: string
}

const emptyForm: ServerForm = { name: '', username: '', password: '', host: '' }

const inputClass =
  'w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20'

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServerForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Server | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchServers = useCallback(async () => {
    try {
      const response = await requestWithToken({ method: 'GET', url: '/api/server/list' })
      if (response.ok) {
        setServers(response.data as Server[])
        setPageError('')
      } else {
        setPageError(String(response.data))
      }
    } catch {
      setPageError('Failed to load server list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  function handleRefresh() {
    setLoading(true)
    fetchServers()
  }

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setFormError('')
    setDialogMode('add')
  }

  function openEdit(server: Server) {
    setForm({ name: server.name, username: server.username, password: '', host: server.host })
    setEditingId(server.id)
    setFormError('')
    setDialogMode('edit')
  }

  function closeDialog() {
    if (!submitting) setDialogMode(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.username.trim() || !form.host.trim()) {
      setFormError('Please fill in name, username and host')
      return
    }
    if (dialogMode === 'add' && !form.password) {
      setFormError('Please enter a password')
      return
    }
    setSubmitting(true)
    setFormError('')
    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password || undefined,
      host: form.host.trim(),
    }
    try {
      const url = dialogMode === 'add' ? '/api/server/add' : `/api/server/edit/${editingId}`
      const response = await requestWithToken({ method: 'POST', url, data: payload })
      if (response.ok) {
        setDialogMode(null)
        await fetchServers()
      } else {
        setFormError(String(response.data))
      }
    } catch {
      setFormError('Request failed, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await requestWithToken({
        method: 'DELETE',
        url: `/api/server/del/${deleteTarget.id}`,
      })
      if (response.ok) {
        setDeleteTarget(null)
        await fetchServers()
      }
    } finally {
      setDeleting(false)
    }
  }

  const [actionId, setActionId] = useState<string | null>(null)

  async function handleRun(server: Server) {
    setActionId(server.id)
    try {
      const response = await requestWithToken({
        method: 'POST',
        url: `/api/server/run/${server.id}`,
      })
      if (response.ok) {
        await fetchServers()
      }
    } finally {
      setActionId(null)
    }
  }

  async function handleStop(server: Server) {
    setActionId(server.id)
    try {
      const response = await requestWithToken({
        method: 'POST',
        url: `/api/server/stop`,
      })
      if (response.ok) {
        await fetchServers()
      }
    } finally {
      setActionId(null)
    }
  }

  const anyRunning = servers.some((s) => s.running)

  const [certLoading, setCertLoading] = useState(false)
  const [certRemain, setCertRemain] = useState<number | null>(null)
  const [fingerprintLoading, setFingerprintLoading] = useState(false)
  const [fingerprintDialog, setFingerprintDialog] = useState<string | null>(null)

  function formatRemain(seconds: number): string {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const fetchCertRemain = useCallback(async () => {
    try {
      const response = await requestWithToken({ method: 'GET', url: '/api/server/remain' })
      if (response.ok) {
        setCertRemain(Number(response.data))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (anyRunning) {
      fetchCertRemain()
      const timer = setInterval(fetchCertRemain, 60_000)
      return () => clearInterval(timer)
    } else {
      setCertRemain(null)
    }
  }, [anyRunning, fetchCertRemain])

  async function handleDownloadCert() {
    setCertLoading(true)
    try {
      const response = await axios({
        method: 'GET',
        url: '/api/server/cert',
        responseType: 'blob',
        headers: { token: store.get(tokenAtom) },
      })
      const blob = response.data as Blob
      const disposition = response.headers?.['content-disposition']
      let filename = 'cert.pem'
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setCertLoading(false)
    }
  }

  async function handleGetFingerprint() {
    setFingerprintLoading(true)
    try {
      const response = await requestWithToken({ method: 'GET', url: '/api/server/fingerprint' })
      if (response.ok) {
        setFingerprintDialog(String(response.data))
      }
    } finally {
      setFingerprintLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-100 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/icon.svg" className='flex h-9 w-9 shrink-0 items-center justify-center sm:h-11 sm:w-11' draggable={false} />
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">LocalSocks</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">Manage your proxy configs</p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 hover:shadow disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-indigo-400 sm:h-10 sm:w-10"
              aria-label="Refresh"
            >
              <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: '14px' }} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 active:bg-indigo-700 dark:shadow-indigo-950/50 sm:px-4 sm:py-2.5"
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: '14px' }} />
              <span className="hidden sm:inline">Add Config</span>
              <span className="sm:hidden">Add</span>
            </button>
            {anyRunning && (
              <>
                {certRemain !== null && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:px-3 sm:py-2.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${certRemain < 86400 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="hidden sm:inline">Cert: </span>
                    {formatRemain(certRemain)}
                  </span>
                )}
                <button
                  onClick={handleDownloadCert}
                  disabled={certLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4 sm:py-2.5"
                >
                  {certLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                  ) : (
                    <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: '14px' }} />
                  )}
                  <span className="hidden sm:inline">Cert</span>
                </button>
                <button
                  onClick={handleGetFingerprint}
                  disabled={fingerprintLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4 sm:py-2.5"
                >
                  {fingerprintLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                  ) : (
                    <FontAwesomeIcon icon={faFingerprint} style={{ fontSize: '14px' }} />
                  )}
                  <span className="hidden sm:inline">Fingerprint</span>
                </button>
              </>
            )}
          </div>
        </div>

        {pageError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {pageError}
          </div>
        )}

        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500 dark:text-slate-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
              Loading servers...
            </div>
          ) : servers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <FontAwesomeIcon icon={faSliders} className='h-8! w-8!' />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No config yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Click "Add Config" to create your first config.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/70 text-xs tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Username</th>
                    <th className="px-6 py-4 font-medium">Host</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {servers.map((server) => (
                    <tr key={server.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{server.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{server.username}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{server.host}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            server.running
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${server.running ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
                          {server.running ? 'Running' : 'Stopped'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {server.running ? (
                            <button
                              onClick={() => handleStop(server)}
                              disabled={actionId === server.id}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 disabled:opacity-50"
                              aria-label={`Stop ${server.name}`}
                            >
                              {actionId === server.id ? (
                                <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
                              ) : (
                                <FontAwesomeIcon icon={faStop} style={{ fontSize: '14px' }} />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRun(server)}
                              disabled={actionId === server.id || anyRunning}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 disabled:opacity-50"
                              aria-label={`Run ${server.name}`}
                            >
                              {actionId === server.id ? (
                                <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                              ) : (
                                <FontAwesomeIcon icon={faPlay} style={{ fontSize: '14px' }} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(server)}
                            disabled={server.running}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 disabled:opacity-50"
                            aria-label={`Edit ${server.name}`}
                          >
                            <FontAwesomeIcon icon={faPen} style={{ fontSize: '14px' }} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(server)}
                            disabled={server.running}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 disabled:opacity-50"
                            aria-label={`Delete ${server.name}`}
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '14px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit dialog */}
      {dialogMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDialog} />
          <div className="relative w-full max-w-md animate-[fadeIn_0.15s_ease-out] rounded-2xl border border-slate-200/70 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {dialogMode === 'add' ? 'Add Config' : 'Edit Config'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{formError}</div>
              )}

              <div>
                <label htmlFor="server-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Name
                </label>
                <input
                  id="server-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My config"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="server-host" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Host
                </label>
                <input
                  id="server-host"
                  type="text"
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="server-username" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Username
                </label>
                <input
                  id="server-username"
                  type="text"
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Username"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="server-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password{dialogMode === 'edit' && <span className="ml-1 text-xs font-normal text-slate-400">(leave blank to keep)</span>}
                </label>
                <input
                  id="server-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={dialogMode === 'edit' ? '••••••••' : 'Password'}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 dark:shadow-indigo-950/50"
                >
                  {submitting ? 'Saving...' : dialogMode === 'add' ? 'Add' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
              <FontAwesomeIcon icon={faTrash} className="text-red-600 dark:text-red-400" style={{ fontSize: '18px' }} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Delete server</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-medium text-slate-700 dark:text-slate-200">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-red-200 transition hover:bg-red-500 active:bg-red-700 disabled:opacity-60 dark:shadow-red-950/50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprint dialog */}
      {fingerprintDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setFingerprintDialog(null)} />
          <div className="relative w-full max-w-md animate-[fadeIn_0.15s_ease-out] rounded-2xl border border-slate-200/70 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50">
              <FontAwesomeIcon icon={faFingerprint} className="text-indigo-600 dark:text-indigo-400" style={{ fontSize: '18px' }} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Certificate Fingerprint</h2>
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 font-mono text-sm break-all text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              {fingerprintDialog}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(fingerprintDialog)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Copy
              </button>
              <button
                onClick={() => setFingerprintDialog(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 active:bg-indigo-700 dark:shadow-indigo-950/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}