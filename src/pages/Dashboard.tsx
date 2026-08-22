import { useCallback, useEffect, useState } from 'react'
import {
  Add as AddIcon,
  DeleteOutlined as DeleteOutlineIcon,
  EditOutlined as EditOutlinedIcon,
  RefreshOutlined as RefreshOutlinedIcon,
} from '@mui/icons-material'
import type { Server } from '../utils/types'
import { requestWithToken } from '../utils/requests'

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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-100 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 4-5.5 4-9a13.3 13.3 0 00-4-9m0 18c-2.5-2.5-4-5.5-4-9a13.3 13.3 0 014-9" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">LocalSocks</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your proxy configs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 hover:shadow disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-indigo-400"
              aria-label="Refresh"
            >
              <RefreshOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 active:bg-indigo-700 dark:shadow-indigo-950/50"
            >
              <AddIcon sx={{ fontSize: 18 }} />
              Add Config
            </button>
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
              <svg className="h-10 w-10 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0v-.75a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 015.25 3.75h13.5A2.25 2.25 0 0121 6v2.25a2.25 2.25 0 01-2.25 2.25v.75" />
              </svg>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No servers yet</p>
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
                          <button
                            onClick={() => openEdit(server)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400"
                            aria-label={`Edit ${server.name}`}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(server)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                            aria-label={`Delete ${server.name}`}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
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
              <DeleteOutlineIcon className="text-red-600 dark:text-red-400" sx={{ fontSize: 22 }} />
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
    </div>
  )
}