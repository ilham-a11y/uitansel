import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Activity, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Save, Search, Trash2, Users } from 'lucide-react'
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Field, Modal, PageHeader, inputClass } from '../components/ui'
import { api, ApiError, errorMessage } from '../lib/api'
import { CATEGORIES, CODE_LABEL, type Category, type Child, type ExamResult } from '../lib/types'
import { childCode, formatDate } from '../lib/format'

const PAGE_SIZE = 8
type Filter = 'Semua' | 'Belum diklasifikasi' | Category

type Form = {
  name: string
  age: string
  gender: string
  weight: string
  height: string
  head: string
  motor: string
  speech: string
}
type FormErrors = Partial<Record<keyof Form, string>>

const EMPTY: Form = { name: '', age: '', gender: '', weight: '', height: '', head: '', motor: '', speech: '' }
const fromChild = (c: Child): Form => ({
  name: c.name,
  age: String(c.age),
  gender: c.gender,
  weight: String(c.weight),
  height: String(c.height),
  head: String(c.head),
  motor: String(c.motor),
  speech: String(c.speech),
})

function validateForm(f: Form): FormErrors {
  const e: FormErrors = {}
  if (!f.name.trim()) e.name = 'Nama anak wajib diisi.'
  const age = Number(f.age)
  if (f.age === '' || !Number.isInteger(age) || age < 0 || age > 72) e.age = 'Usia harus 0–72 bulan.'
  if (!f.gender) e.gender = 'Pilih jenis kelamin.'
  const inRange = (v: string, min: number, max: number) => v !== '' && Number(v) >= min && Number(v) <= max
  if (!inRange(f.weight, 1, 30)) e.weight = 'Berat badan 1–30 kg.'
  if (!inRange(f.height, 30, 150)) e.height = 'Tinggi badan 30–150 cm.'
  if (!inRange(f.head, 25, 65)) e.head = 'Lingkar kepala 25–65 cm.'
  if (!['1', '2', '3'].includes(f.motor)) e.motor = 'Pilih penilaian motorik.'
  if (!['1', '2', '3'].includes(f.speech)) e.speech = 'Pilih penilaian bicara.'
  return e
}

/* ---------- Form tambah / ubah ---------- */

function ChildFormModal({
  child,
  onClose,
  onSaved,
  notify,
}: {
  child: Child | null
  onClose: () => void
  onSaved: () => Promise<void>
  notify: (m: string, t?: 'success' | 'error') => void
}) {
  const [form, setForm] = useState<Form>(child ? fromChild(child) : EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [busy, setBusy] = useState(false)

  const set = (key: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = validateForm(form)
    setErrors(v)
    if (Object.keys(v).length) return
    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      weight: Number(form.weight),
      height: Number(form.height),
      head: Number(form.head),
      motor: Number(form.motor),
      speech: Number(form.speech),
    }
    setBusy(true)
    try {
      if (child) await api.put(`/children/${child.id}`, payload)
      else await api.post('/children', payload)
      notify(child ? 'Data anak berhasil diperbarui.' : 'Data anak berhasil ditambahkan.')
      await onSaved()
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields as FormErrors)
      notify(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const unitInput = (key: keyof Form, unit: string, step = '0.1') => (
    <Field label={labelOf[key]} error={errors[key]} required>
      <div className="relative">
        <input
          className={`${inputClass} pr-16`}
          type="number"
          step={step}
          inputMode="decimal"
          value={form[key]}
          onChange={set(key)}
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">{unit}</span>
      </div>
    </Field>
  )

  return (
    <Modal
      title={child ? 'Ubah Data Anak' : 'Tambah Data Anak'}
      eyebrow={child ? 'Perbarui data' : 'Data baru'}
      description="Lengkapi data berikut untuk digunakan dalam proses klasifikasi."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" form="child-form" disabled={busy} icon={<Save size={20} />}>
            {busy ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </>
      }
    >
      <form id="child-form" onSubmit={submit} className="grid gap-8" noValidate>
        <fieldset>
          <legend className="mb-4 flex items-center gap-3 text-lg font-extrabold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-sm text-white">A</span>
            Identitas anak
          </legend>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Nama anak" error={errors.name} required className="sm:col-span-3">
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Masukkan nama lengkap" />
            </Field>
            {unitInput('age', 'bulan', '1')}
            <Field label="Jenis kelamin" error={errors.gender} required className="sm:col-span-2">
              <select className={inputClass} value={form.gender} onChange={set('gender')}>
                <option value="">Pilih jenis kelamin</option>
                <option>Perempuan</option>
                <option>Laki-laki</option>
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 flex items-center gap-3 text-lg font-extrabold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-sm text-white">B</span>
            Pengukuran fisik
          </legend>
          <div className="grid gap-5 sm:grid-cols-3">
            {unitInput('weight', 'kg')}
            {unitInput('height', 'cm')}
            {unitInput('head', 'cm')}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 flex items-center gap-3 text-lg font-extrabold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-sm text-white">C</span>
            Perkembangan anak
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kemampuan motorik" error={errors.motor} required>
              <select className={inputClass} value={form.motor} onChange={set('motor')}>
                <option value="">Pilih penilaian</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    Kode {n} — {CODE_LABEL[n]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kemampuan bicara" error={errors.speech} required>
              <select className={inputClass} value={form.speech} onChange={set('speech')}>
                <option value="">Pilih penilaian</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    Kode {n} — {CODE_LABEL[n]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-500">
            Pengodean digunakan untuk simulasi penelitian dan bukan standar penilaian klinis.
          </p>
        </fieldset>
      </form>
    </Modal>
  )
}

const labelOf: Record<string, string> = {
  age: 'Usia',
  weight: 'Berat badan',
  height: 'Tinggi badan',
  head: 'Lingkar kepala',
}

/* ---------- Detail ---------- */

function ChildDetailModal({
  child,
  last,
  canWrite,
  onClose,
  onEdit,
  onClassify,
}: {
  child: Child
  last: ExamResult | undefined
  canWrite: boolean
  onClose: () => void
  onEdit: () => void
  onClassify: () => void
}) {
  const measures = [
    ['Berat badan', child.weight, 'kg'],
    ['Tinggi badan', child.height, 'cm'],
    ['Lingkar kepala', child.head, 'cm'],
  ] as const
  return (
    <Modal
      title={child.name}
      eyebrow={`Detail data · ${childCode(child.id)}`}
      description={`${child.gender} · ${child.age} bulan`}
      onClose={onClose}
      footer={
        canWrite ? (
          <>
            <Button variant="secondary" onClick={onEdit} icon={<Pencil size={18} />}>
              Ubah Data
            </Button>
            <Button onClick={onClassify} icon={<Activity size={20} />}>
              Klasifikasi Sekarang
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
        <Avatar name={child.name} size="lg" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Hasil klasifikasi terakhir</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge category={last?.category} />
            {last && <span className="text-base text-slate-500">Diperiksa {formatDate(last.date)}</span>}
          </div>
        </div>
      </div>

      <h3 className="mb-3 mt-8 text-base font-extrabold uppercase tracking-wider text-emerald-700">Pengukuran fisik</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {measures.map(([label, value, unit]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {value} <span className="text-base font-bold text-slate-400">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-8 text-base font-extrabold uppercase tracking-wider text-emerald-700">Perkembangan anak</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-500">Kemampuan motorik</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">Kode {child.motor}</p>
          <p className="text-base text-slate-600">{CODE_LABEL[child.motor]}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-500">Kemampuan bicara</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">Kode {child.speech}</p>
          <p className="text-base text-slate-600">{CODE_LABEL[child.speech]}</p>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Halaman utama ---------- */

export default function ChildrenPage({
  childList,
  results,
  onClassify,
  refresh,
  notify,
  canWrite = true,
}: {
  childList: Child[]
  results: ExamResult[]
  onClassify: (id: number) => void
  refresh: () => Promise<void>
  notify: (m: string, t?: 'success' | 'error') => void
  canWrite?: boolean
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('Semua')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Child | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Child | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const filtered = useMemo(
    () =>
      childList.filter((c) => {
        const matchName = c.name.toLowerCase().includes(search.trim().toLowerCase())
        const matchFilter =
          filter === 'Semua' ? true : filter === 'Belum diklasifikasi' ? !c.lastCategory : c.lastCategory === filter
        return matchName && matchFilter
      }),
    [childList, search, filter],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const detail = detailId ? childList.find((c) => c.id === detailId) ?? null : null
  const lastResultOf = (id: number) => results.find((r) => r.childId === id)

  const remove = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.delete(`/children/${deleting.id}`)
      notify(`Data ${deleting.name} berhasil dihapus.`)
      setDeleting(null)
      setDetailId(null)
      await refresh()
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  const deletingResults = deleting ? results.filter((r) => r.childId === deleting.id).length : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <PageHeader
        eyebrow="Pengelolaan data"
        title="Data Anak"
        description={
          canWrite
            ? 'Kelola identitas, pengukuran, dan perkembangan anak. Data tersimpan di browser ini.'
            : 'Lihat data anak dan hapus data yang tidak diperlukan. Penambahan dan perubahan data dilakukan oleh petugas posyandu.'
        }
        actions={
          canWrite ? (
            <Button onClick={() => setEditing('new')} icon={<Plus size={20} />}>
              Tambah Data Anak
            </Button>
          ) : undefined
        }
      />

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-12`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama anak..."
              aria-label="Cari nama anak"
            />
          </div>
          <select
            className={`${inputClass} md:w-64`}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as Filter)
              setPage(1)
            }}
            aria-label="Filter kategori"
          >
            <option value="Semua">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
            <option value="Belum diklasifikasi">Belum diklasifikasi</option>
          </select>
          <span className="text-base font-semibold text-slate-500 md:ml-auto">{filtered.length} data ditemukan</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={childList.length === 0 ? 'Belum ada data anak' : 'Data tidak ditemukan'}
            text={
              childList.length === 0
                ? 'Tambahkan data anak pertama Anda untuk mulai melakukan pemeriksaan.'
                : 'Ubah kata pencarian atau filter kategori untuk melihat data lain.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] whitespace-nowrap text-left">
              <thead className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Nama anak</th>
                  <th className="px-4 py-4">Usia</th>
                  <th className="px-4 py-4">BB / TB / LK</th>
                  <th className="px-4 py-4">Motorik</th>
                  <th className="px-4 py-4">Bicara</th>
                  <th className="px-4 py-4">Hasil terakhir</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((c) => (
                  <tr key={c.id} className="text-base transition hover:bg-emerald-50/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-sm text-slate-500">
                            {childCode(c.id)} · {c.gender}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{c.age} bln</td>
                    <td className="px-4 py-4 text-slate-600">
                      {c.weight} kg · {c.height} cm · {c.head} cm
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <span className="font-bold text-slate-800">K{c.motor}</span> · {CODE_LABEL[c.motor]}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <span className="font-bold text-slate-800">K{c.speech}</span> · {CODE_LABEL[c.speech]}
                    </td>
                    <td className="px-4 py-4">
                      <Badge category={c.lastCategory} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <IconBtn label="Lihat detail" onClick={() => setDetailId(c.id)}>
                          <Eye size={19} />
                        </IconBtn>
                        {canWrite && (
                          <>
                            <IconBtn label="Ubah data" onClick={() => setEditing(c)}>
                              <Pencil size={19} />
                            </IconBtn>
                            <IconBtn label="Klasifikasi" onClick={() => onClassify(c.id)} tone="emerald">
                              <Activity size={19} />
                            </IconBtn>
                          </>
                        )}
                        <IconBtn label="Hapus data" onClick={() => setDeleting(c)} tone="rose">
                          <Trash2 size={19} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-base text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Menampilkan {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–
            {Math.min(current * PAGE_SIZE, filtered.length)} dari {childList.length} data
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
              aria-label="Halaman sebelumnya"
              className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[6rem] text-center font-bold text-slate-700">
              Hal. {current} / {totalPages}
            </span>
            <button
              disabled={current >= totalPages}
              onClick={() => setPage(current + 1)}
              aria-label="Halaman berikutnya"
              className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {detail && (
        <ChildDetailModal
          child={detail}
          last={lastResultOf(detail.id)}
          canWrite={canWrite}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setEditing(detail)
            setDetailId(null)
          }}
          onClassify={() => onClassify(detail.id)}
        />
      )}

      {editing && (
        <ChildFormModal
          child={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await refresh()
          }}
          notify={notify}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus data anak?"
          message={`Data ${deleting.name} akan dihapus permanen${
            deletingResults ? `, beserta ${deletingResults} riwayat pemeriksaannya` : ''
          }. Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, hapus data"
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
          busy={deleteBusy}
        />
      )}
    </div>
  )
}

function IconBtn({
  label,
  onClick,
  children,
  tone = 'slate',
}: {
  label: string
  onClick: () => void
  children: ReactNode
  tone?: 'slate' | 'emerald' | 'rose'
}) {
  const toneCls = {
    slate: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    emerald: 'text-emerald-700 hover:bg-emerald-100',
    rose: 'text-rose-600 hover:bg-rose-50',
  }[tone]
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-11 w-11 place-items-center rounded-xl transition ${toneCls}`}
    >
      {children}
    </button>
  )
}
