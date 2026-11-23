import { useCallback, useEffect, useState } from 'react'
import { Activity, FileText, House, LayoutDashboard, Loader2, UserCog, Users } from 'lucide-react'
import Layout, { type NavItem, type Page } from './components/Layout'
import { Toast } from './components/ui'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ChildrenPage from './pages/ChildrenPage'
import ClassifyPage from './pages/ClassifyPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import { api, errorMessage, getToken, setToken, setUnauthorizedHandler } from './lib/api'
import type { Child, ExamResult, User } from './lib/types'

type ToastState = { id: number; message: string; tone: 'success' | 'error' }

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(() => Boolean(getToken()))
  const [page, setPage] = useState<Page>('beranda')
  const isAdmin = user?.role === 'admin'
  const [childList, setChildList] = useState<Child[]>([])
  const [results, setResults] = useState<ExamResult[]>([])
  const [classifyChildId, setClassifyChildId] = useState<number | null>(null)
  const [reportId, setReportId] = useState<number | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setChildList([])
    setResults([])
    setPage('beranda')
    setReportId(null)
    setClassifyChildId(null)
  }, [])

  // Jika token kedaluwarsa di tengah pemakaian, kembali ke halaman masuk.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      notify('Sesi Anda telah berakhir. Silakan masuk kembali.', 'error')
    })
  }, [logout, notify])

  // Pulihkan sesi dari token yang tersimpan.
  useEffect(() => {
    if (!getToken()) return
    api
      .get<{ user: User }>('/auth/me')
      .then((r) => {
        setUser(r.user)
        setPage(r.user.role === 'admin' ? 'pengguna' : 'beranda')
      })
      .catch(() => setToken(null))
      .finally(() => setBooting(false))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([api.get<Child[]>('/children'), api.get<ExamResult[]>('/results')])
      setChildList(c)
      setResults(r)
    } catch (err) {
      notify(errorMessage(err), 'error')
    }
  }, [notify])

  useEffect(() => {
    if (user) void refresh()
  }, [user, refresh])

  const go = useCallback((p: Page) => {
    setPage(p)
    if (p !== 'laporan') setReportId(null)
    window.scrollTo({ top: 0 })
  }, [])

  const openReport = useCallback((id: number, print = false) => {
    setReportId(id)
    setPage('laporan')
    window.scrollTo({ top: 0 })
    if (print) window.setTimeout(() => window.print(), 450)
  }, [])

  const classifyFor = useCallback((id: number) => {
    setClassifyChildId(id)
    setPage('klasifikasi')
    window.scrollTo({ top: 0 })
  }, [])

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-lg font-bold text-emerald-700">
          <Loader2 className="animate-spin" size={26} /> Memuat TumbuhRuang...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginPage
          onLogin={(u) => {
            setUser(u)
            setPage(u.role === 'admin' ? 'pengguna' : 'beranda')
            notify(`Selamat datang, ${u.name}!`)
          }}
          notify={notify}
        />
        {toast && <Toast key={toast.id} message={toast.message} tone={toast.tone} />}
      </>
    )
  }

  // Admin: fokus pada akun, melihat & menghapus data anak dan hasil klasifikasi.
  // Petugas: input data anak dan menjalankan klasifikasi.
  const items: NavItem[] = isAdmin
    ? [
        { id: 'pengguna', label: 'Kelola Akun', icon: UserCog },
        { id: 'anak', label: 'Data Anak', icon: Users },
        { id: 'laporan', label: 'Hasil Klasifikasi', icon: FileText },
      ]
    : [
        { id: 'beranda', label: 'Beranda', icon: House },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'anak', label: 'Data Anak', icon: Users },
        { id: 'klasifikasi', label: 'Klasifikasi K-NN', icon: Activity },
        { id: 'laporan', label: 'Hasil Klasifikasi', icon: FileText },
      ]

  return (
    <>
      <Layout
        user={user}
        page={page}
        items={items}
        onNavigate={go}
        onLogout={() => {
          logout()
          notify('Anda telah keluar dari aplikasi.')
        }}
      >
        {page === 'beranda' && !isAdmin && <HomePage user={user} childList={childList} results={results} onNavigate={go} />}
        {page === 'dashboard' && !isAdmin && (
          <DashboardPage childList={childList} results={results} onNavigate={go} onOpenReport={(id) => openReport(id)} />
        )}
        {page === 'anak' && (
          <ChildrenPage
            childList={childList}
            results={results}
            onClassify={classifyFor}
            refresh={refresh}
            notify={notify}
            canWrite={!isAdmin}
          />
        )}
        {page === 'klasifikasi' && !isAdmin && (
          <ClassifyPage
            childList={childList}
            initialChildId={classifyChildId}
            refresh={refresh}
            notify={notify}
            onOpenReport={openReport}
          />
        )}
        {page === 'laporan' && (
          <ReportsPage
            results={results}
            reportId={reportId}
            onOpen={(id) => setReportId(id)}
            onBack={() => setReportId(null)}
            refresh={refresh}
            notify={notify}
          />
        )}
        {page === 'pengguna' && isAdmin && <UsersPage currentUserId={user.id} notify={notify} />}
      </Layout>
      {toast && <Toast key={toast.id} message={toast.message} tone={toast.tone} />}
    </>
  )
}
