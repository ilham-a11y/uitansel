import { Activity, ArrowRight, ClipboardList, FileText, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, Donut, EmptyState, PageHeader } from '../components/ui'
import type { Page } from '../components/Layout'
import { CATEGORIES, CATEGORY_COLOR, type Child, type ExamResult } from '../lib/types'
import { formatDate } from '../lib/format'

const severity = (c: Child['lastCategory']) => (c === 'Risiko Berat' ? 2 : c === 'Risiko Sedang' ? 1 : 0)

export default function DashboardPage({
  childList,
  results,
  onNavigate,
  onOpenReport,
}: {
  childList: Child[]
  results: ExamResult[]
  onNavigate: (p: Page) => void
  onOpenReport: (id: number) => void
}) {
  const diperiksa = childList.filter((c) => c.lastCategory).length
  const counts = CATEGORIES.map((cat) => childList.filter((c) => c.lastCategory === cat).length)
  const perluPerhatian = childList
    .filter((c) => c.lastCategory && c.lastCategory !== 'Normal')
    .sort((a, b) => severity(b.lastCategory) - severity(a.lastCategory))
    .slice(0, 5)

  const metrics = [
    { label: 'Total anak', value: childList.length, sub: `${diperiksa} sudah diperiksa`, icon: Users, cls: 'bg-emerald-100 text-emerald-700' },
    { label: 'Total pemeriksaan', value: results.length, sub: 'tersimpan di sistem', icon: ClipboardList, cls: 'bg-teal-100 text-teal-700' },
    { label: 'Risiko sedang', value: counts[1], sub: 'kondisi terakhir', icon: Activity, cls: 'bg-amber-100 text-amber-700' },
    { label: 'Risiko berat', value: counts[2], sub: 'kondisi terakhir', icon: Activity, cls: 'bg-rose-100 text-rose-700' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard pemantauan"
        description="Lihat kondisi terakhir setiap anak dan pemeriksaan terbaru dari satu tempat."
        actions={
          <>
            <Button variant="secondary" onClick={() => onNavigate('anak')} icon={<Users size={20} />}>
              Data Anak
            </Button>
            <Button onClick={() => onNavigate('klasifikasi')} icon={<Activity size={20} />}>
              Mulai Klasifikasi
            </Button>
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label} className="p-6">
              <div className="flex items-start justify-between">
                <p className="text-base font-semibold text-slate-500">{m.label}</p>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${m.cls}`}>
                  <Icon size={24} />
                </span>
              </div>
              <p className="mt-4 text-4xl font-extrabold text-slate-900">{m.value}</p>
              <p className="mt-1 text-sm text-slate-500">{m.sub}</p>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card className="p-7">
          <h2 className="text-xl font-extrabold text-slate-900">Distribusi kondisi terakhir</h2>
          <p className="mb-6 text-base text-slate-500">Berdasarkan hasil klasifikasi terakhir setiap anak</p>
          {diperiksa === 0 ? (
            <EmptyState
              icon={<Activity size={28} />}
              title="Belum ada hasil"
              text="Jalankan klasifikasi pertama untuk melihat distribusi kondisi anak."
            />
          ) : (
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
              <Donut
                total={diperiksa}
                label="anak diperiksa"
                segments={CATEGORIES.map((c, i) => ({ name: c, value: counts[i], color: CATEGORY_COLOR[c] }))}
              />
              <ul className="w-full max-w-xs space-y-4">
                {CATEGORIES.map((c, i) => (
                  <li key={c} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4">
                    <span className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: CATEGORY_COLOR[c] }} />
                      {c}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900">{counts[i]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Perlu perhatian</h2>
              <p className="text-base text-slate-500">Anak dengan kondisi risiko terakhir</p>
            </div>
          </div>
          {perluPerhatian.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title="Tidak ada yang perlu perhatian" text="Semua anak yang sudah diperiksa berada dalam kondisi normal." />
          ) : (
            <ul className="space-y-3">
              {perluPerhatian.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onNavigate('anak')}
                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-slate-900">{c.name}</p>
                      <p className="text-sm text-slate-500">{c.age} bulan · {c.lastDate ? formatDate(c.lastDate) : '-'}</p>
                    </div>
                    <Badge category={c.lastCategory} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Pemeriksaan terbaru</h2>
            <p className="text-base text-slate-500">Lima pemeriksaan yang paling baru disimpan</p>
          </div>
          <button onClick={() => onNavigate('laporan')} className="inline-flex items-center gap-2 text-base font-bold text-emerald-700 hover:text-emerald-900">
            <FileText size={18} /> Lihat semua laporan <ArrowRight size={18} />
          </button>
        </div>
        {results.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="Belum ada laporan" text="Laporan akan muncul setelah Anda menyimpan hasil klasifikasi." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap text-left">
              <thead className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-7 py-4">Nama anak</th>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-7 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.slice(0, 5).map((r) => (
                  <tr key={r.id} className="text-base hover:bg-slate-50/70">
                    <td className="px-7 py-4 font-bold text-slate-900">{r.childName}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-4"><Badge category={r.category} /></td>
                    <td className="px-7 py-4 text-right">
                      <button onClick={() => r.id && onOpenReport(r.id)} className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900">
                        Lihat hasil <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
