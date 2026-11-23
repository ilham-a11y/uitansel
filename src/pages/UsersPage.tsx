import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { KeyRound, Pencil, Save, Shield, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { Avatar, Button, Card, ConfirmDialog, EmptyState, Field, Modal, PageHeader, inputClass } from '../components/ui'
import { api, ApiError, errorMessage } from '../lib/api'
import type { Role, User } from '../lib/types'
import { formatDate } from '../lib/format'

type Notify = (m: string, t?: 'success' | 'error') => void

const roleLabel: Record<Role, string> = { admin: 'Administrator', petugas: 'Petugas Posyandu' }

export default function UsersPage({ currentUserId, notify }: { currentUserId: number; notify: Notify }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await api.get<User[]>('/users'))
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api.delete(`/users/${deleting.id}`)
      notify('Akun berhasil dihapus.')
      setDeleting(null)
      await load()
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const admins = users.filter((u) => u.role === 'admin').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <PageHeader
        eyebrow="Khusus admin"
        title="Kelola Akun"
        description="Tambah akun baru, ubah data akun, reset kata sandi untuk pengguna yang lupa, atau hapus akun yang tidak lagi digunakan."
        actions={
          <Button onClick={() => setAdding(true)} icon={<UserPlus size={20} />}>
            Tambah Akun
          </Button>
        }
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Users size={26} /></span>
          <div><p className="text-base font-semibold text-slate-500">Total akun</p><p className="text-3xl font-extrabold">{users.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-100 text-teal-700"><ShieldCheck size={26} /></span>
          <div><p className="text-base font-semibold text-slate-500">Admin</p><p className="text-3xl font-extrabold">{admins}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Shield size={26} /></span>
          <div><p className="text-base font-semibold text-slate-500">Petugas</p><p className="text-3xl font-extrabold">{users.length - admins}</p></div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="px-6 py-16 text-center text-lg text-slate-500">Memuat data akun...</p>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="Belum ada akun" text="Tambahkan akun pertama untuk petugas posyandu." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] whitespace-nowrap text-left">
              <thead className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Akun</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Peran</th>
                  <th className="px-4 py-4">Dibuat</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const self = u.id === currentUserId
                  return (
                    <tr key={u.id} className="text-base">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900">
                              {u.name} {self && <span className="text-sm font-semibold text-emerald-600">(Anda)</span>}
                            </p>
                            <p className="font-mono text-sm text-slate-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{u.email ?? '—'}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
                            u.role === 'admin' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {roleLabel[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(u)}
                            aria-label={`Ubah akun ${u.name}`}
                            title="Ubah akun"
                            className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Pencil size={19} />
                          </button>
                          <button
                            type="button"
                            disabled={self}
                            onClick={() => setDeleting(u)}
                            aria-label={`Hapus akun ${u.name}`}
                            title={self ? 'Tidak dapat menghapus akun sendiri' : 'Hapus akun'}
                            className="grid h-11 w-11 place-items-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={19} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {adding && (
        <AccountFormModal
          target={null}
          currentUserId={currentUserId}
          notify={notify}
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false)
            await load()
          }}
        />
      )}

      {editing && (
        <AccountFormModal
          target={editing}
          currentUserId={currentUserId}
          notify={notify}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus akun ini?"
          message={`Akun @${deleting.username} (${deleting.name}) akan dihapus. Data anak dan hasil klasifikasi yang pernah dicatat akun ini tetap tersimpan.`}
          confirmLabel="Ya, hapus akun"
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  )
}

// Dipakai untuk tambah akun (target = null) dan ubah akun (target = akun terpilih).
function AccountFormModal({
  target,
  currentUserId,
  notify,
  onClose,
  onSaved,
}: {
  target: User | null
  currentUserId: number
  notify: Notify
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const isEdit = target !== null
  const self = target?.id === currentUserId
  const [form, setForm] = useState({
    name: target?.name ?? '',
    username: target?.username ?? '',
    email: target?.email ?? '',
    role: (target?.role ?? 'petugas') as Role,
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((prev) => ({ ...prev, [k]: '' }))
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      if (isEdit) {
        // Kata sandi hanya dikirim jika diisi (reset kata sandi).
        const payload: Record<string, string> = {
          name: form.name,
          username: form.username,
          email: form.email,
          role: form.role,
        }
        if (form.password) payload.password = form.password
        await api.put(`/users/${target!.id}`, payload)
        notify('Data akun berhasil diperbarui.')
      } else {
        await api.post('/users', form)
        notify('Akun baru berhasil ditambahkan.')
      }
      await onSaved()
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields)
      notify(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Ubah Akun' : 'Tambah Akun'}
      eyebrow={isEdit ? `Akun @${target!.username}` : 'Akun baru'}
      description={
        isEdit
          ? 'Perbarui data akun. Isi kata sandi baru hanya jika ingin mengganti (misalnya pengguna lupa kata sandi).'
          : 'Buat akun untuk petugas posyandu atau administrator.'
      }
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" form="account-form" disabled={busy} icon={isEdit ? <Save size={20} /> : <UserPlus size={20} />}>
            {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Akun'}
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={submit} className="grid gap-5" noValidate>
        <Field label="Nama lengkap" required error={errors.name}>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Contoh: Siti Aminah" />
        </Field>
        <Field label="Username" required error={errors.username} hint="3–30 karakter: huruf, angka, titik, atau _">
          <input className={inputClass} value={form.username} onChange={set('username')} placeholder="Contoh: siti_aminah" autoComplete="off" />
        </Field>
        <Field label="Email" error={errors.email} hint="Opsional">
          <input className={inputClass} type="email" value={form.email} onChange={set('email')} placeholder="nama@email.com" autoComplete="off" />
        </Field>
        <Field label="Peran" required error={errors.role}>
          <select className={inputClass} value={form.role} onChange={set('role')} disabled={self}>
            <option value="petugas">Petugas Posyandu</option>
            <option value="admin">Administrator</option>
          </select>
          {self && <span className="mt-2 block text-sm text-slate-500">Peran akun sendiri tidak dapat diubah.</span>}
        </Field>
        <Field
          label={isEdit ? 'Kata sandi baru' : 'Kata sandi awal'}
          required={!isEdit}
          error={errors.password}
          hint={isEdit ? 'Kosongkan jika tidak ingin mengganti kata sandi. Minimal 6 karakter.' : 'Minimal 6 karakter. Minta pengguna menggantinya setelah masuk.'}
        >
          <div className="relative">
            <KeyRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-11`}
              type="password"
              value={form.password}
              onChange={set('password')}
              required={!isEdit}
              minLength={isEdit ? undefined : 6}
              placeholder={isEdit ? 'Biarkan kosong jika tidak diganti' : 'Minimal 6 karakter'}
              autoComplete="new-password"
            />
          </div>
        </Field>
      </form>
    </Modal>
  )
}
