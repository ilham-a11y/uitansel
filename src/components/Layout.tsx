import { useState, type ReactNode } from 'react'
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { Avatar } from './ui'
import type { User } from '../lib/types'

export type Page = 'beranda' | 'dashboard' | 'anak' | 'klasifikasi' | 'laporan' | 'pengguna'
export interface NavItem {
  id: Page
  label: string
  icon: LucideIcon
}

export default function Layout({
  user,
  page,
  items,
  onNavigate,
  onLogout,
  children,
}: {
  user: User
  page: Page
  items: NavItem[]
  onNavigate: (p: Page) => void
  onLogout: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const go = (id: Page) => {
    onNavigate(id)
    setOpen(false)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
          <button onClick={() => go('beranda')} className="flex shrink-0 items-center gap-3" aria-label="Ke beranda">
            <img src="/brand-logo.png" alt="" className="h-12 w-12 object-contain" />
            <span className="text-left">
              <span className="block text-xl font-extrabold leading-none text-slate-900">TumbuhRuang</span>
              <span className="mt-1 hidden text-sm text-slate-500 sm:block">Pemantauan tumbuh kembang anak</span>
            </span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 xl:flex" aria-label="Menu utama">
            {items.map((item) => {
              const Icon = item.icon
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-base font-bold transition ${
                    active ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <Avatar name={user.name} size="sm" />
              <div className="hidden leading-tight 2xl:block">
                <p className="text-base font-bold text-slate-800">{user.name}</p>
                <p className="text-sm text-slate-500">{user.role === 'admin' ? 'Administrator' : 'Petugas Posyandu'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="hidden items-center gap-2 whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-base font-bold text-emerald-800 ring-1 ring-slate-200 hover:bg-emerald-50 md:flex"
            >
              <LogOut size={18} />
              Keluar
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-700 xl:hidden"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={open}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-emerald-100 bg-white px-4 pb-5 pt-3 xl:hidden" aria-label="Menu seluler">
            <div className="grid gap-2">
              {items.map((item) => {
                const Icon = item.icon
                const active = page === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-bold ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={22} />
                    {item.label}
                  </button>
                )
              })}
              <button
                onClick={onLogout}
                className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={22} />
                Keluar
              </button>
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            <span className="font-extrabold text-emerald-700">TumbuhRuang</span> · Prototipe skrining tumbuh kembang anak
          </p>
          <p>Hasil klasifikasi merupakan pendukung skrining awal, bukan diagnosis medis.</p>
        </div>
      </footer>
    </div>
  )
}
