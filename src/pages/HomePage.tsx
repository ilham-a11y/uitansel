import { Activity, ArrowRight, ClipboardList, FileText, Info, ShieldAlert, Users } from 'lucide-react'
import TreeArt from '../components/TreeArt'
import { Button, Card } from '../components/ui'
import type { Page } from '../components/Layout'
import { greeting } from '../lib/format'
import type { Child, ExamResult, User } from '../lib/types'

const toneClass = {
  emerald: 'bg-emerald-100 text-emerald-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-amber-100 text-amber-700',
} as const

export default function HomePage({
  user,
  childList,
  results,
  onNavigate,
}: {
  user: User
  childList: Child[]
  results: ExamResult[]
  onNavigate: (p: Page) => void
}) {
  const firstName = user.name.split(' ')[0]
  const perluTindakLanjut = childList.filter((c) => c.lastCategory && c.lastCategory !== 'Normal').length

  const stats = [
    { label: 'Anak terdaftar', value: childList.length, icon: Users, tone: 'emerald' as const },
    { label: 'Pemeriksaan tersimpan', value: results.length, icon: ClipboardList, tone: 'teal' as const },
    { label: 'Perlu tindak lanjut', value: perluTindakLanjut, icon: ShieldAlert, tone: 'amber' as const },
  ]

  const steps = [
    { no: '01', icon: Users, title: 'Catat data anak', text: 'Simpan identitas, pengukuran fisik, dan perkembangan anak secara berkala.', page: 'anak' as Page },
    { no: '02', icon: Activity, title: 'Jalankan klasifikasi', text: 'Pilih data anak, periksa enam parameter, lalu proses dengan algoritma K-NN.', page: 'klasifikasi' as Page },
    { no: '03', icon: FileText, title: 'Tinjau & cetak laporan', text: 'Lihat tetangga terdekat, hasil voting, dan rekomendasi tindak lanjut.', page: 'laporan' as Page },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Hero */}
      <section className="animate-fade-up grid items-center gap-10 overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-7 text-white shadow-2xl shadow-emerald-700/20 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-base font-bold backdrop-blur">
            {greeting()}, {firstName}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] sm:text-5xl">
            Pantau tumbuh kembang, <span className="text-emerald-100">mulai dari data yang rapi.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-emerald-50">
            Catat pengukuran anak, jalankan klasifikasi K-NN, dan tinjau rekomendasi tindak lanjut dalam satu alur yang jelas.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button variant="light" onClick={() => onNavigate('klasifikasi')} icon={<Activity size={20} />}>
              Mulai Klasifikasi
            </Button>
            <Button variant="glass" onClick={() => onNavigate('anak')}>
              Kelola Data Anak
            </Button>
          </div>
        </div>
        <div className="rounded-[1.75rem] bg-white p-4 shadow-xl shadow-emerald-900/20 sm:p-6">
          <TreeArt className="h-auto w-full" />
        </div>
      </section>

      {/* Ringkasan */}
      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="flex items-center gap-5 p-6">
              <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${toneClass[s.tone]}`}>
                <Icon size={30} />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-500">{s.label}</p>
                <p className="mt-1 text-4xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </Card>
          )
        })}
      </section>

      {/* Alur */}
      <section>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-600">Alur sederhana</p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-900">Tiga langkah untuk pemantauan terarah</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <button
                key={step.no}
                onClick={() => onNavigate(step.page)}
                className="group rounded-3xl bg-white p-7 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon size={28} />
                  </span>
                  <span className="text-lg font-extrabold text-slate-300">{step.no}</span>
                </div>
                <h3 className="mt-6 text-xl font-extrabold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-500">{step.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-base font-bold text-emerald-700">
                  Buka <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex gap-4 rounded-3xl bg-amber-50 p-6 text-base leading-relaxed text-amber-900 ring-1 ring-amber-200">
        <Info size={24} className="mt-0.5 shrink-0" />
        <p>
          Hasil klasifikasi merupakan <strong>pendukung skrining awal</strong> dan perlu ditinjau oleh tenaga kesehatan. Hasil ini bukan diagnosis medis.
        </p>
      </div>
    </div>
  )
}
