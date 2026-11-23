import { useState, type FormEvent } from 'react'
import { Activity, Eye, EyeOff, LogIn, ShieldCheck, Users, UserPlus } from 'lucide-react'
import TreeArt from '../components/TreeArt'
import { Button, Field, inputClass } from '../components/ui'
import { api, errorMessage, setToken } from '../lib/api'
import type { User } from '../lib/types'

export default function LoginPage({
  onLogin,
  notify,
}: {
  onLogin: (u: User) => void
  notify: (message: string, tone?: 'success' | 'error') => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isLogin = mode === 'login'

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError('')
    setPassword('')
    setConfirm('')
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!isLogin && password !== confirm) {
      setError('Konfirmasi kata sandi tidak sesuai.')
      return
    }
    setBusy(true)
    try {
      if (isLogin) {
        const res = await api.post<{ token: string; user: User }>('/auth/login', { username, password })
        setToken(res.token)
        onLogin(res.user)
      } else {
        await api.post('/auth/register', { name, email, username, password })
        switchMode('login')
        setUsername('')
        notify('Akun berhasil dibuat. Silakan masuk dengan akun baru Anda.')
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Panel kiri: ilustrasi & manfaat (desktop) */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <img src="/brand-logo.png" alt="" className="h-14 w-14 object-contain" />
          <span className="text-2xl font-extrabold">TumbuhRuang</span>
        </div>

        <div className="relative my-auto max-w-xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-100">Untuk petugas posyandu</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.15] xl:text-5xl">
            Pantau tumbuh kembang anak dengan lebih teratur.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-emerald-50">
            Catat data anak, jalankan klasifikasi K-NN, dan simpan laporan tindak lanjut dalam satu tempat.
          </p>
          <ul className="mt-7 grid gap-3">
            {[
              { icon: Users, text: 'Data anak tercatat rapi dan mudah dicari' },
              { icon: Activity, text: 'Klasifikasi K-NN dijalankan di server dengan data latih terpusat' },
              { icon: ShieldCheck, text: 'Laporan siap dicetak sebagai pendukung skrining awal' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3.5 text-base font-semibold backdrop-blur xl:text-lg">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20">
                  <Icon size={22} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

      </section>

      {/* Panel kanan: formulir */}
      <section className="flex items-center justify-center bg-[#f3faf6] px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-5">
            <TreeArt className="mx-auto h-40 w-auto lg:h-48" />
            <div className="mt-1 flex items-center justify-center gap-2 text-2xl font-extrabold text-emerald-800 lg:hidden">
              <img src="/brand-logo.png" alt="" className="h-8 w-8 object-contain" /> TumbuhRuang
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-xl shadow-emerald-900/5 ring-1 ring-slate-200/70 sm:p-10">
            <div className="mb-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5" role="tablist">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-xl py-3 text-base font-bold transition ${
                    mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'login' ? 'Masuk' : 'Daftar Akun'}
                </button>
              ))}
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900">
              {isLogin ? 'Selamat datang kembali' : 'Buat akun petugas'}
            </h2>
            <p className="mb-7 mt-2 text-base leading-relaxed text-slate-500">
              {isLogin
                ? 'Masuk untuk melanjutkan pemantauan tumbuh kembang anak.'
                : 'Lengkapi data berikut. Akun baru otomatis berperan sebagai petugas.'}
            </p>

            <form onSubmit={submit} className="grid gap-5">
              {!isLogin && (
                <>
                  <Field label="Nama lengkap" required>
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Contoh: Siti Aminah"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email" hint="Opsional">
                    <input
                      className={inputClass}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      autoComplete="email"
                    />
                  </Field>
                </>
              )}

              <Field label="Username" required>
                <input
                  className={inputClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder={isLogin ? 'Masukkan username' : 'Huruf, angka, titik, atau _'}
                  autoComplete="username"
                />
              </Field>

              <Field label="Kata sandi" required>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-14`}
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isLogin ? undefined : 6}
                    placeholder={isLogin ? 'Masukkan kata sandi' : 'Minimal 6 karakter'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                  >
                    {show ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </Field>

              {!isLogin && (
                <Field label="Ulangi kata sandi" required>
                  <input
                    className={inputClass}
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Ketik ulang kata sandi"
                    autoComplete="new-password"
                  />
                </Field>
              )}

              {error && (
                <div role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-base font-semibold text-rose-700 ring-1 ring-rose-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="mt-2 w-full py-4 text-lg"
                icon={isLogin ? <LogIn size={22} /> : <UserPlus size={22} />}
              >
                {busy ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat Akun'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Prototipe penelitian K-Nearest Neighbors · Bukan sistem diagnosis medis
          </p>
        </div>
      </section>
    </div>
  )
}
