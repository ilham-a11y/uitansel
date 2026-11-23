import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Eye, Loader2, Printer, Save, Sprout, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, Modal, PageHeader } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { CATEGORIES, CATEGORY_COLOR, CODE_LABEL, RECOMMENDATION, type Category, type Child, type ExamResult, type ModelInfo } from '../lib/types'
import { childCode, formatDate } from '../lib/format'

const resultBg: Record<Category, string> = {
  Normal: 'bg-emerald-50',
  'Risiko Sedang': 'bg-amber-50',
  'Risiko Berat': 'bg-rose-50',
}

export default function ClassifyPage({
  childList,
  initialChildId,
  refresh,
  notify,
  onOpenReport,
}: {
  childList: Child[]
  initialChildId: number | null
  refresh: () => Promise<void>
  notify: (m: string, t?: 'success' | 'error') => void
  onOpenReport: (id: number, print?: boolean) => void
}) {
  const [selectedId, setSelectedId] = useState<number | null>(initialChildId)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [model, setModel] = useState<ModelInfo | null>(null)

  useEffect(() => {
    api.get<ModelInfo>('/model/info').then(setModel).catch(() => setModel(null))
  }, [])

  const selected = childList.find((c) => c.id === selectedId) ?? null
  const currentStep = result ? 2 : selected ? 1 : 0
  const steps = ['Pilih data anak', 'Periksa parameter', 'Lihat hasil']

  const choose = (id: number | null) => {
    setSelectedId(id)
    setResult(null)
    setError('')
  }

  const run = async () => {
    if (!selected) return
    setProcessing(true)
    setError('')
    setResult(null)
    try {
      setResult(await api.post<ExamResult>('/classify', { childId: selected.id }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const save = async (): Promise<ExamResult | null> => {
    if (!selected || !result) return null
    if (result.id) return result
    setSaving(true)
    try {
      const saved = await api.post<ExamResult>('/results', { childId: selected.id })
      setResult(saved)
      notify('Hasil klasifikasi berhasil disimpan ke laporan.')
      await refresh()
      return saved
    } catch (err) {
      notify(errorMessage(err), 'error')
      return null
    } finally {
      setSaving(false)
    }
  }

  const printReport = async () => {
    const saved = await save()
    if (saved?.id) onOpenReport(saved.id, true)
  }

  const params = selected
    ? [
        { label: 'Usia', value: `${selected.age} bulan` },
        { label: 'Berat badan', value: `${selected.weight} kg` },
        { label: 'Tinggi badan', value: `${selected.height} cm` },
        { label: 'Lingkar kepala', value: `${selected.head} cm` },
        { label: 'Motorik', value: `Kode ${selected.motor}`, hint: CODE_LABEL[selected.motor] },
        { label: 'Bicara', value: `Kode ${selected.speech}`, hint: CODE_LABEL[selected.speech] },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <PageHeader
        eyebrow="Simulasi penelitian"
        title="Klasifikasi K-NN"
        description="Ikuti tiga tahap berikut. Perhitungan dijalankan di server menggunakan model yang sudah dilatih."
      />

      {/* Stepper */}
      <ol className="mb-8 grid gap-3 md:grid-cols-3">
        {steps.map((label, i) => {
          const done = i < currentStep
          const current = i === currentStep
          return (
            <li
              key={label}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 ring-1 transition ${
                current ? 'bg-white ring-emerald-300 shadow-md shadow-emerald-900/5' : done ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'
              }`}
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-extrabold ${
                  done || current ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? <CheckCircle2 size={22} /> : i + 1}
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Tahap {i + 1}</p>
                <p className="text-base font-extrabold text-slate-900">{label}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 font-extrabold text-white">1</span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Pilih data anak</h2>
              <p className="text-base text-slate-500">Pilih anak yang datanya sudah tersimpan.</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-base font-bold text-slate-700">Data anak</span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              value={selectedId ?? ''}
              onChange={(e) => choose(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Pilih nama anak —</option>
              {childList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.age} bulan
                </option>
              ))}
            </select>
          </label>

          {!selected ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
              <Users size={32} className="text-slate-400" />
              <p className="text-base text-slate-500">
                {childList.length === 0
                  ? 'Belum ada data anak. Tambahkan data anak terlebih dahulu di menu Data Anak.'
                  : 'Belum ada data dipilih. Pilih anak untuk menampilkan parameternya.'}
              </p>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-emerald-50/70 p-5">
              <Avatar name={selected.name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Data terpilih</p>
                <p className="truncate text-xl font-extrabold text-slate-900">{selected.name}</p>
                <p className="text-base text-slate-600">
                  {selected.gender} · {selected.age} bulan · {childCode(selected.id)}
                </p>
              </div>
            </div>
          )}

          <div className="my-8 h-px bg-slate-100" />

          <div className="mb-5 flex items-start gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 font-extrabold text-white">2</span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Periksa parameter</h2>
              <p className="text-base text-slate-500">Enam fitur berikut digunakan untuk menghitung jarak Euclidean.</p>
            </div>
          </div>

          {selected ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {params.map((p) => (
                  <div key={p.label} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-500">{p.label}</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900">{p.value}</p>
                    {p.hint && <p className="text-sm text-slate-500">{p.hint}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-teal-50 px-5 py-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Nilai K</p>
                  <p className="text-sm text-teal-900">Sistem memilih {model?.k ?? '—'} tetangga terdekat untuk voting mayoritas.</p>
                </div>
                <span className="text-4xl font-extrabold text-teal-700">{model?.k ?? '—'}</span>
              </div>

              {error && (
                <div role="alert" className="mt-5 flex items-center gap-3 rounded-2xl bg-rose-50 px-5 py-4 text-base font-semibold text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle size={22} /> {error}
                </div>
              )}

              <Button
                onClick={run}
                disabled={processing}
                className="mt-6 w-full py-4 text-lg sm:w-auto"
                icon={processing ? <Loader2 size={22} className="animate-spin" /> : <Activity size={22} />}
              >
                {processing ? 'Sedang memproses...' : 'Proses Klasifikasi'}
              </Button>
            </>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-5 py-6 text-base text-slate-500">Parameter akan tampil setelah data anak dipilih.</p>
          )}
        </Card>

        <aside className="space-y-5">
          {model && (
            <Card className="p-6">
              <h3 className="mb-1 text-lg font-extrabold text-slate-900">Model K-NN</h3>
              <p className="mb-4 text-sm text-slate-500">Dilatih terpisah dengan validasi silang dan data uji terpisah.</p>
              <dl className="grid grid-cols-2 gap-3 text-base">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <dt className="text-xs font-semibold text-slate-500">Nilai K</dt>
                  <dd className="font-extrabold text-slate-900">{model.k}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <dt className="text-xs font-semibold text-slate-500">Data latih</dt>
                  <dd className="font-extrabold text-slate-900">{model.jumlah_data_latih} data</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <dt className="text-xs font-semibold text-slate-500">Akurasi uji</dt>
                  <dd className="font-extrabold text-slate-900">{(model.evaluasi_uji.akurasi * 100).toFixed(1)}%</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <dt className="text-xs font-semibold text-slate-500">Pembanding</dt>
                  <dd className="font-extrabold text-slate-900">{(model.evaluasi_uji.baseline_mayoritas * 100).toFixed(1)}%</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">Pembanding = akurasi jika selalu menebak kategori terbanyak.</p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-extrabold text-slate-900">Tentang proses</h3>
            <ol className="space-y-5">
              {[
                ['Jarak Euclidean', 'Enam fitur anak dibandingkan dengan seluruh data latih.'],
                [`${model?.k ?? 'K'} tetangga terdekat`, 'Data latih dengan jarak terkecil dipilih.'],
                ['Voting mayoritas', 'Kategori yang paling banyak muncul menjadi hasil akhir.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="text-base font-extrabold text-emerald-500">0{i + 1}</span>
                  <div>
                    <p className="text-base font-bold text-slate-900">{t}</p>
                    <p className="text-sm leading-relaxed text-slate-500">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wider text-amber-800">
              Simulasi · data fiktif
            </p>
          </Card>
        </aside>
      </div>

      {result && selected && (
        <section className="animate-fade-up mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-600">Tahap 3 · Pemrosesan berhasil</p>
              <h2 className="text-3xl font-extrabold text-slate-900">Hasil Klasifikasi</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-500">Simulasi</span>
          </div>

          <Card className="overflow-hidden">
            <div className={`flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 ${resultBg[result.category]}`}>
              <div className="flex items-center gap-4">
                <Avatar name={selected.name} size="lg" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Hasil untuk</p>
                  <h3 className="text-2xl font-extrabold text-slate-900">{selected.name}</h3>
                  <p className="text-base text-slate-600">
                    {selected.age} bulan · Pemeriksaan {formatDate(result.date)}
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Hasil klasifikasi</p>
                <Badge category={result.category} size="lg" />
              </div>
            </div>

            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
              <div>
                <h4 className="mb-4 text-lg font-extrabold text-slate-900">Parameter yang digunakan</h4>
                <dl className="grid grid-cols-2 gap-3 text-base">
                  {[
                    ['Usia', `${selected.age} bln`],
                    ['Berat', `${selected.weight} kg`],
                    ['Tinggi', `${selected.height} cm`],
                    ['Lingkar kepala', `${selected.head} cm`],
                    ['Motorik', `Kode ${selected.motor}`],
                    ['Bicara', `Kode ${selected.speech}`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <dt className="text-sm font-semibold text-slate-500">{k}</dt>
                      <dd className="font-extrabold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h4 className="mb-4 text-lg font-extrabold text-slate-900">Jumlah kategori dari {result.k} tetangga terdekat</h4>
                <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
                  {CATEGORIES.map((c) => {
                    const n = result.votes[c]
                    return (
                      <div key={c}>
                        <div className="mb-2 flex justify-between text-base font-bold text-slate-700">
                          <span>{c}</span>
                          <span>{n} tetangga</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(n / result.k) * 100}%`, background: CATEGORY_COLOR[c] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mx-6 flex gap-4 rounded-2xl bg-emerald-50 p-5 sm:mx-8">
              <Sprout size={28} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <h4 className="mb-1 text-lg font-extrabold text-emerald-900">Rekomendasi tindak lanjut</h4>
                <p className="text-base leading-relaxed text-emerald-900/80">{RECOMMENDATION[result.category]}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
              <Button variant="secondary" onClick={() => setDetailOpen(true)} icon={<Eye size={20} />}>
                Lihat Detail Perhitungan
              </Button>
              <Button
                variant="secondary"
                onClick={save}
                disabled={saving || !!result.id}
                icon={result.id ? <CheckCircle2 size={20} /> : <Save size={20} />}
              >
                {result.id ? 'Tersimpan' : saving ? 'Menyimpan...' : 'Simpan Hasil'}
              </Button>
              <Button onClick={printReport} disabled={saving} icon={<Printer size={20} />}>
                Cetak Laporan
              </Button>
            </div>
          </Card>
        </section>
      )}

      {detailOpen && result && <CalcDetail child={selected} result={result} onClose={() => setDetailOpen(false)} />}
    </div>
  )
}

function CalcDetail({ child, result, onClose }: { child: Child | null; result: ExamResult; onClose: () => void }) {
  return (
    <Modal
      size="lg"
      eyebrow="Simulasi perhitungan"
      title="Detail Perhitungan K-NN"
      description={`${child?.name ?? result.childName} · K = ${result.k} · ${formatDate(result.date)}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <details className="group rounded-2xl ring-1 ring-slate-200" open>
          <summary className="cursor-pointer list-none px-5 py-4 text-lg font-extrabold text-slate-900">1 · Data anak</summary>
          <div className="px-5 pb-5 text-base text-slate-600">
            Nama <b className="text-slate-900">{result.childName}</b> · Usia <b className="text-slate-900">{result.age} bulan</b> · {result.gender}
          </div>
        </details>

        <details className="rounded-2xl ring-1 ring-slate-200" open>
          <summary className="cursor-pointer list-none px-5 py-4 text-lg font-extrabold text-slate-900">2 · Perhitungan jarak Euclidean</summary>
          <div className="space-y-4 px-5 pb-5">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-xl font-extrabold text-emerald-800">d(x,y) = √Σ(xᵢ − yᵢ)²</p>
            <p className="text-base text-slate-600">
              Jarak dihitung pada data yang sudah dinormalisasi. Baris yang disorot adalah {result.k} tetangga terdekat yang dipakai untuk voting. Nilai fitur data latih tidak ditampilkan.
            </p>
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                  <tr>
                    {['Peringkat', 'Jarak', 'Kategori', 'Dipakai voting'].map((h) => (
                      <th key={h} className="px-3 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.neighbors.map((n) => (
                    <tr key={n.rank} className={n.rank <= result.k ? 'bg-emerald-50/70' : ''}>
                      <td className="px-3 py-2.5 font-bold">Tetangga #{n.rank}</td>
                      <td className="px-3 py-2.5 font-bold">{n.distance.toFixed(3)}</td>
                      <td className="px-3 py-2.5"><Badge category={n.category} /></td>
                      <td className="px-3 py-2.5">{n.rank <= result.k ? 'Ya' : 'Tidak'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <details className="rounded-2xl ring-1 ring-slate-200" open>
          <summary className="cursor-pointer list-none px-5 py-4 text-lg font-extrabold text-slate-900">3 · Penentuan kategori berdasarkan mayoritas</summary>
          <div className="flex flex-wrap gap-3 px-5 pb-5">
            {CATEGORIES.map((c) => (
              <div key={c} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <Badge category={c} />
                <span className="text-lg font-extrabold">{result.votes[c]} tetangga</span>
              </div>
            ))}
            <p className="w-full text-sm text-slate-600">
              Kategori dengan jumlah tetangga terbanyak dipilih. Jika jumlahnya sama, prioritasnya Normal, Risiko Sedang, lalu Risiko Berat.
            </p>
            <p className="w-full text-base text-slate-600">
              Hasil akhir: <Badge category={result.category} />
            </p>
          </div>
        </details>
      </div>
    </Modal>
  )
}
