import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, Eye, FileText, Printer, Sprout, Trash2, AlertTriangle } from 'lucide-react'
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, inputClass } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { CATEGORIES, CODE_LABEL, RECOMMENDATION, type Category, type ExamResult } from '../lib/types'
import { childCode, formatDate, todayIso } from '../lib/format'

export default function ReportsPage({
  results,
  reportId,
  onOpen,
  onBack,
  refresh,
  notify,
}: {
  results: ExamResult[]
  reportId: number | null
  onOpen: (id: number) => void
  onBack: () => void
  refresh: () => Promise<void>
  notify: (m: string, t?: 'success' | 'error') => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'Semua' | Category>('Semua')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [deleting, setDeleting] = useState<ExamResult | null>(null)
  const [busy, setBusy] = useState(false)

  const printFrom = (id: number) => {
    onOpen(id)
    window.setTimeout(() => window.print(), 450)
  }

  const filtered = useMemo(
    () =>
      results.filter(
        (r) =>
          r.childName.toLowerCase().includes(search.trim().toLowerCase()) &&
          (filter === 'Semua' || r.category === filter) &&
          (!from || r.date >= from) &&
          (!to || r.date <= to),
      ),
    [results, search, filter, from, to],
  )

  const report = reportId ? results.find((r) => r.id === reportId) ?? null : null
  if (report) return <ReportView result={report} onBack={onBack} />

  const hasFilter = search || filter !== 'Semua' || from || to
  const reset = () => {
    setSearch('')
    setFilter('Semua')
    setFrom('')
    setTo('')
  }

  const remove = async () => {
    if (!deleting?.id) return
    setBusy(true)
    try {
      await api.delete(`/results/${deleting.id}`)
      notify('Laporan berhasil dihapus.')
      setDeleting(null)
      await refresh()
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <PageHeader
        eyebrow="Arsip pemeriksaan"
        title="Laporan"
        description="Temukan, tinjau, dan cetak hasil klasifikasi yang telah disimpan."
      />

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center">
          <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama anak..." aria-label="Cari nama anak" />
          <input className={inputClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Tanggal mulai" max={to || todayIso()} />
          <input className={inputClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Tanggal akhir" min={from || undefined} max={todayIso()} />
          <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value as 'Semua' | Category)} aria-label="Filter kategori">
            <option value="Semua">Semua kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {hasFilter ? (
            <Button variant="ghost" onClick={reset}>
              Reset filter
            </Button>
          ) : (
            <span className="hidden md:block" />
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={results.length === 0 ? 'Belum ada laporan' : 'Laporan tidak ditemukan'}
            text={
              results.length === 0
                ? 'Laporan akan muncul setelah Anda menyimpan hasil klasifikasi.'
                : 'Ubah pencarian, rentang tanggal, atau filter kategori untuk melihat laporan lain.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] whitespace-nowrap text-left">
              <thead className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">No. laporan</th>
                  <th className="px-4 py-4">Nama anak</th>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="text-base hover:bg-emerald-50/40">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-800">LAP-{String(r.id).padStart(5, '0')}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">{r.childName}</p>
                      <p className="text-sm text-slate-500">
                        {r.age} bulan · {r.gender}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-4">
                      <Badge category={r.category} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" className="px-4 py-2.5 text-sm" icon={<Eye size={18} />} onClick={() => r.id && onOpen(r.id)}>
                          Lihat
                        </Button>
                        <Button variant="secondary" className="px-4 py-2.5 text-sm" icon={<Printer size={18} />} onClick={() => r.id && printFrom(r.id)}>
                          Cetak
                        </Button>
                        <button
                          type="button"
                          title="Hapus laporan"
                          aria-label="Hapus laporan"
                          onClick={() => setDeleting(r)}
                          className="grid h-11 w-11 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleting && (
        <ConfirmDialog
          title="Hapus laporan ini?"
          message={`Laporan ${deleting.childName} tanggal ${formatDate(deleting.date)} akan dihapus. Data anak tidak ikut terhapus.`}
          confirmLabel="Ya, hapus laporan"
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  )
}

/* ---------- Tampilan laporan (siap cetak) ---------- */

function ReportView({ result, onBack }: { result: ExamResult; onBack: () => void }) {
  const reportNo = `LAP-${String(result.id).padStart(5, '0')}`
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={20} />}>
          Kembali ke daftar laporan
        </Button>
        <Button onClick={() => window.print()} icon={<Printer size={20} />}>
          Cetak / Simpan PDF
        </Button>
      </div>

      <article className="print-area rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-12">
        <header className="flex flex-col gap-4 border-b-2 border-emerald-600 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white">
              <Sprout size={26} />
            </span>
            <div>
              <p className="text-xl font-extrabold text-slate-900">TumbuhRuang</p>
              <p className="text-sm text-slate-500">Sistem Klasifikasi Tumbuh Kembang Anak</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-extrabold tracking-wider text-emerald-700">LAPORAN SKRINING AWAL</p>
            <p className="font-mono text-sm text-slate-500">No. {reportNo}</p>
          </div>
        </header>

        <div className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Ringkasan pemeriksaan</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Laporan Hasil Klasifikasi</h1>
            <p className="mt-1 text-base text-slate-500">Metode K-Nearest Neighbors (K = {result.k})</p>
          </div>
          <Badge category={result.category} size="lg" />
        </div>

        <Section title="01 · Identitas anak">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Nama anak" value={result.childName} />
            <Info label="Kode data" value={childCode(result.childId)} />
            <Info label="Usia" value={`${result.age} bulan`} />
            <Info label="Jenis kelamin" value={result.gender} />
            <Info label="Tanggal pemeriksaan" value={formatDate(result.date)} />
          </dl>
        </Section>

        <Section title="02 · Parameter pemeriksaan">
          <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="w-full min-w-[560px] text-left text-base">
              <thead className="bg-slate-50 text-sm font-bold uppercase text-slate-500">
                <tr>
                  {['Usia', 'Berat', 'Tinggi', 'Lingkar kepala', 'Motorik', 'Bicara'].map((h) => (
                    <th key={h} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-slate-900">
                  <td className="px-4 py-3">{result.age} bulan</td>
                  <td className="px-4 py-3">{result.weight} kg</td>
                  <td className="px-4 py-3">{result.height} cm</td>
                  <td className="px-4 py-3">{result.head} cm</td>
                  <td className="px-4 py-3">Kode {result.motor}</td>
                  <td className="px-4 py-3">Kode {result.speech}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Motorik: {CODE_LABEL[result.motor]} · Bicara: {CODE_LABEL[result.speech]}
          </p>
        </Section>

        <Section title="03 · Hasil klasifikasi">
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
            <div>
              <p className="text-sm font-semibold text-slate-500">Hasil akhir</p>
              <div className="mt-2">
                <Badge category={result.category} size="lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((c) => (
                <div key={c} className="rounded-xl bg-white px-3 py-3 text-center ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">{c}</p>
                  <p className="text-2xl font-extrabold text-slate-900">{result.votes[c]}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="04 · Tetangga terdekat">
          <p className="mb-4 text-base leading-relaxed text-slate-600">
            Jarak dihitung dengan rumus Euclidean pada data yang sudah dinormalisasi. {result.k} tetangga terdekat dipilih untuk voting mayoritas.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.neighbors.slice(0, result.k).map((n) => (
              <div key={n.rank} className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-slate-200 px-4 py-3 text-sm">
                <span className="font-bold text-slate-700">Tetangga #{n.rank}</span>
                <Badge category={n.category} />
                <span className="font-mono font-bold text-slate-900">{n.distance.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="05 · Rekomendasi">
          <div className="flex gap-4 rounded-2xl bg-emerald-50 p-5">
            <Sprout size={26} className="mt-0.5 shrink-0 text-emerald-700" />
            <p className="text-base leading-relaxed text-emerald-900">{RECOMMENDATION[result.category]}</p>
          </div>
        </Section>

        <div className="mt-8 flex gap-3 rounded-2xl bg-amber-50 p-5 text-base leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle size={22} className="mt-0.5 shrink-0" />
          <p>
            <strong>Catatan penting:</strong> Hasil ini bukan diagnosis medis.
          </p>
        </div>

        <footer className="mt-8 flex flex-col gap-1 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <span>TumbuhRuang · Prototipe penelitian</span>
          <span>Dicetak {formatDate(todayIso())}</span>
        </footer>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 border-b border-slate-100 pb-3 text-sm font-extrabold uppercase tracking-wider text-emerald-700">{title}</h2>
      {children}
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-slate-900">{value}</dd>
    </div>
  )
}
