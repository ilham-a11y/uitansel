// Penyimpanan data di browser (localStorage). Menggantikan database.
// Aturan akses sama dengan versi server:
//   - admin  : kelola akun; melihat & menghapus data anak dan hasil
//   - petugas: tambah/ubah data anak, klasifikasi, simpan hasil, hapus data
// Klasifikasi K-NN tetap dijalankan di server (/api/predict). Data latih tidak pernah dikirim ke browser.

import { ApiError } from './errors'
import {
  CATEGORIES,
  type Category,
  type Child,
  type ExamResult,
  type Gender,
  type ModelInfo,
  type Neighbor,
  type Role,
  type User,
} from './types'

const DB_KEY = 'tumbuhruang-local-v4'
const GENDERS: Gender[] = ['Perempuan', 'Laki-laki']
const ROLES: Role[] = ['admin', 'petugas']

interface StoredUser extends User {
  createdAt: string
  salt: string
  passwordHash: string
}
interface StoredChild {
  id: number
  name: string
  age: number
  gender: Gender
  weight: number
  height: number
  head: number
  motor: number
  speech: number
  createdBy: number | null
}
interface StoredResult {
  seq: number
  id: number
  childId: number
  childName: string
  age: number
  gender: Gender
  weight: number
  height: number
  head: number
  motor: number
  speech: number
  date: string
  category: Category
  k: number
  votes: Record<Category, number>
  neighbors: Neighbor[]
  createdBy: number | null
}
interface Db {
  seq: { user: number; child: number; result: number }
  users: StoredUser[]
  children: StoredChild[]
  results: StoredResult[]
}

let cache: Db | null = null

/* ---------- Penyimpanan ---------- */

function save() {
  if (cache) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(cache))
    } catch {
      throw new ApiError('Penyimpanan browser penuh atau tidak tersedia.', 500)
    }
  }
}

async function db(): Promise<Db> {
  if (cache) return cache
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    try {
      cache = JSON.parse(raw) as Db
      return cache
    } catch {
      // data rusak: dibuat ulang di bawah
    }
  }
  cache = await seed()
  save()
  return cache
}

// Mengembalikan data awal seperti versi database (akun admin & petugas, serta lima data anak contoh).
async function seed(): Promise<Db> {
  const d: Db = { seq: { user: 0, child: 0, result: 0 }, users: [], children: [], results: [] }
  await addUser(d, { name: 'Administrator', username: 'admin', email: 'admin@tumbuhruang.local', role: 'admin', password: 'admin123' })
  await addUser(d, { name: 'Nadia Sari', username: 'user', email: 'nadia@tumbuhruang.local', role: 'petugas', password: 'user123' })
  const kids: Omit<StoredChild, 'id' | 'createdBy'>[] = [
    { name: 'Alya Putri', age: 28, gender: 'Perempuan', weight: 12.1, height: 88, head: 49, motor: 3, speech: 3 },
    { name: 'Bima Pratama', age: 36, gender: 'Laki-laki', weight: 12.4, height: 91, head: 49.5, motor: 2, speech: 2 },
    { name: 'Citra Lestari', age: 42, gender: 'Perempuan', weight: 12, height: 92, head: 48, motor: 2, speech: 1 },
    { name: 'Damar Aji', age: 24, gender: 'Laki-laki', weight: 11.3, height: 84, head: 48.5, motor: 3, speech: 3 },
    { name: 'Elina Maharani', age: 31, gender: 'Perempuan', weight: 10.2, height: 86, head: 47, motor: 1, speech: 2 },
  ]
  for (const k of kids) d.children.push({ ...k, id: ++d.seq.child, createdBy: 1 })
  return d
}

/* ---------- Kata sandi (hash SHA-256 dengan garam, dihitung di browser) ---------- */

function randomHex(bytes = 16) {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string, salt: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

const todayIso = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

async function addUser(
  d: Db,
  data: { name: string; username: string; email: string | null; role: Role; password: string },
): Promise<StoredUser> {
  const salt = randomHex()
  const user: StoredUser = {
    id: ++d.seq.user,
    name: data.name,
    username: data.username,
    email: data.email,
    role: data.role,
    createdAt: todayIso(),
    salt,
    passwordHash: await hashPassword(data.password, salt),
  }
  d.users.push(user)
  return user
}

/* ---------- Validasi (sama dengan versi server) ---------- */

function validateChild(body: Record<string, unknown> = {}) {
  const errors: Record<string, string> = {}
  const name = String(body.name ?? '').trim()
  if (!name || name.length > 120) errors.name = 'Nama anak wajib diisi (maks. 120 karakter).'
  const age = Number(body.age)
  if (!Number.isInteger(age) || age < 0 || age > 72) errors.age = 'Usia harus berupa bilangan bulat 0–72 bulan.'
  if (!GENDERS.includes(body.gender as Gender)) errors.gender = 'Pilih jenis kelamin.'
  const weight = Number(body.weight)
  if (!(weight >= 1 && weight <= 30)) errors.weight = 'Berat badan harus 1–30 kg.'
  const height = Number(body.height)
  if (!(height >= 30 && height <= 150)) errors.height = 'Tinggi badan harus 30–150 cm.'
  const head = Number(body.head)
  if (!(head >= 25 && head <= 65)) errors.head = 'Lingkar kepala harus 25–65 cm.'
  const motor = Number(body.motor)
  if (![1, 2, 3].includes(motor)) errors.motor = 'Pilih penilaian kemampuan motorik.'
  const speech = Number(body.speech)
  if (![1, 2, 3].includes(speech)) errors.speech = 'Pilih penilaian kemampuan bicara.'
  return {
    errors,
    value: { name, age, gender: body.gender as Gender, weight, height, head, motor, speech },
  }
}

// partial = true: hanya field yang dikirim yang divalidasi (dipakai saat ubah akun).
function validateUser(body: Record<string, unknown> = {}, partial = false) {
  const errors: Record<string, string> = {}
  const value: { name?: string; username?: string; email?: string | null; role?: Role; password?: string } = {}
  const has = (k: string) => body[k] !== undefined

  if (!partial || has('name')) {
    const name = String(body.name ?? '').trim()
    if (!name) errors.name = 'Nama lengkap wajib diisi.'
    else value.name = name
  }
  if (!partial || has('username')) {
    const username = String(body.username ?? '').trim()
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
      errors.username = 'Username 3–30 karakter (huruf, angka, titik, atau garis bawah).'
    } else value.username = username
  }
  if (has('email')) {
    const email = String(body.email ?? '').trim()
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Format email tidak valid.'
    else value.email = email || null
  }
  if (!partial || has('role')) {
    const role = (body.role ?? 'petugas') as Role
    if (!ROLES.includes(role)) errors.role = 'Peran tidak valid.'
    else value.role = role
  }
  if (!partial || (has('password') && String(body.password) !== '')) {
    const password = String(body.password ?? '')
    if (password.length < 6) errors.password = 'Kata sandi minimal 6 karakter.'
    else value.password = password
  }
  return { errors, value }
}

/* ---------- Tampilan data ---------- */

const publicUser = (u: StoredUser): User => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
})

const newestFirst = (a: StoredResult, b: StoredResult) => b.seq - a.seq

function childView(c: StoredChild, results: StoredResult[]): Child {
  const last = results.filter((r) => r.childId === c.id).sort(newestFirst)[0]
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    gender: c.gender,
    weight: c.weight,
    height: c.height,
    head: c.head,
    motor: c.motor,
    speech: c.speech,
    lastCategory: last?.category ?? null,
    lastDate: last?.date ?? null,
  }
}

function resultView(r: StoredResult): ExamResult {
  return {
    id: r.id,
    childId: r.childId,
    childName: r.childName,
    age: r.age,
    gender: r.gender,
    weight: r.weight,
    height: r.height,
    head: r.head,
    motor: r.motor,
    speech: r.speech,
    date: r.date,
    category: r.category,
    k: r.k,
    votes: r.votes,
    neighbors: r.neighbors,
  }
}

/* ---------- Panggilan ke server (klasifikasi & ringkasan model) ---------- */

async function predict(child: Pick<Child, 'age' | 'weight' | 'height' | 'head' | 'motor' | 'speech'>) {
  let res: Response
  try {
    res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: child.age,
        weight: child.weight,
        height: child.height,
        head: child.head,
        motor: child.motor,
        speech: child.speech,
      }),
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke layanan klasifikasi. Periksa koneksi internet.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.message || 'Klasifikasi gagal. Silakan coba lagi.', res.status, data.errors)
  return data as { category: Category; votes: Record<Category, number>; k: number; neighbors: Neighbor[] }
}

async function fetchModelInfo(): Promise<ModelInfo> {
  let res: Response
  try {
    res = await fetch('/api/model')
  } catch {
    throw new ApiError('Tidak dapat terhubung ke layanan model.', 0)
  }
  if (!res.ok) throw new ApiError('Informasi model tidak tersedia.', res.status)
  return (await res.json()) as ModelInfo
}

/* ---------- Router ---------- */

export async function localRequest<T>(method: string, path: string, body: unknown, token: string | null): Promise<T> {
  const d = await db()
  const b = (body ?? {}) as Record<string, unknown>
  const me = token ? d.users.find((u) => String(u.id) === token) ?? null : null

  const need = (role?: Role): StoredUser => {
    if (!me) throw new ApiError('Silakan masuk terlebih dahulu.', 401)
    if (role && me.role !== role) {
      throw new ApiError(
        role === 'admin'
          ? 'Hanya admin yang dapat mengakses fitur ini.'
          : 'Fitur ini hanya untuk petugas posyandu. Admin hanya dapat melihat dan menghapus data.',
        403,
      )
    }
    return me
  }
  const idOf = (p: string, prefix: string) => {
    const m = p.match(new RegExp(`^${prefix}/(\\d+)$`))
    return m ? Number(m[1]) : null
  }

  /* ----- Publik ----- */

  if (method === 'POST' && path === '/auth/login') {
    const username = String(b.username ?? '').trim()
    const password = String(b.password ?? '')
    if (!username || !password) throw new ApiError('Username dan kata sandi wajib diisi.', 400)
    const u = d.users.find((x) => x.username === username)
    const ok = u && (await hashPassword(password, u.salt)) === u.passwordHash
    if (!u || !ok) throw new ApiError('Username atau kata sandi tidak sesuai.', 401)
    return { token: String(u.id), user: publicUser(u) } as T
  }

  if (method === 'POST' && path === '/auth/register') {
    const { errors, value } = validateUser({ ...b, role: 'petugas' })
    if (Object.keys(errors).length) throw new ApiError('Data belum valid.', 400, errors)
    if (d.users.some((u) => u.username === value.username || (value.email && u.email === value.email))) {
      throw new ApiError('Username atau email sudah terdaftar.', 409)
    }
    await addUser(d, {
      name: value.name!,
      username: value.username!,
      email: value.email ?? null,
      role: 'petugas',
      password: value.password!,
    })
    save()
    return { message: 'Akun berhasil dibuat. Silakan masuk.' } as T
  }

  /* ----- Wajib masuk ----- */

  if (method === 'GET' && path === '/auth/me') {
    return { user: publicUser(need()) } as T
  }

  if (method === 'GET' && path === '/model/info') {
    need()
    return (await fetchModelInfo()) as T
  }

  // Data anak
  if (method === 'GET' && path === '/children') {
    need()
    return d.children
      .map((c) => childView(c, d.results))
      .sort((x, y) => x.name.localeCompare(y.name) || x.id - y.id) as T
  }

  if (method === 'POST' && path === '/children') {
    const user = need('petugas')
    const { errors, value } = validateChild(b)
    if (Object.keys(errors).length) throw new ApiError('Periksa kembali data yang diisi.', 400, errors)
    const c: StoredChild = { id: ++d.seq.child, ...value, createdBy: user.id }
    d.children.push(c)
    save()
    return childView(c, d.results) as T
  }

  const childId = idOf(path, '/children')
  if (childId !== null && method === 'PUT') {
    need('petugas')
    const c = d.children.find((x) => x.id === childId)
    if (!c) throw new ApiError('Data anak tidak ditemukan.', 404)
    const { errors, value } = validateChild(b)
    if (Object.keys(errors).length) throw new ApiError('Periksa kembali data yang diisi.', 400, errors)
    Object.assign(c, value)
    save()
    return childView(c, d.results) as T
  }

  if (childId !== null && method === 'DELETE') {
    need()
    const idx = d.children.findIndex((x) => x.id === childId)
    if (idx < 0) throw new ApiError('Data anak tidak ditemukan.', 404)
    d.children.splice(idx, 1)
    d.results = d.results.filter((r) => r.childId !== childId) // riwayat ikut terhapus
    save()
    return { message: 'Data anak dan riwayat pemeriksaannya berhasil dihapus.' } as T
  }

  // Klasifikasi & hasil
  if (method === 'POST' && path === '/classify') {
    need('petugas')
    const id = Number(b.childId)
    const c = d.children.find((x) => x.id === id)
    if (!c) throw new ApiError('Pilih data anak terlebih dahulu.', 400)
    const pred = await predict(c)
    return {
      id: null,
      childId: c.id,
      childName: c.name,
      age: c.age,
      gender: c.gender,
      weight: c.weight,
      height: c.height,
      head: c.head,
      motor: c.motor,
      speech: c.speech,
      date: todayIso(),
      category: pred.category,
      k: pred.k,
      votes: pred.votes,
      neighbors: pred.neighbors,
    } as T
  }

  if (method === 'GET' && path === '/results') {
    need()
    return [...d.results]
      .sort((x, y) => (y.date.localeCompare(x.date)) || y.seq - x.seq)
      .map(resultView) as T
  }

  if (method === 'POST' && path === '/results') {
    const user = need('petugas')
    const id = Number(b.childId)
    const c = d.children.find((x) => x.id === id)
    if (!c) throw new ApiError('Pilih data anak terlebih dahulu.', 400)
    const pred = await predict(c)
    const r: StoredResult = {
      seq: ++d.seq.result,
      id: d.seq.result,
      childId: c.id,
      childName: c.name,
      age: c.age,
      gender: c.gender,
      weight: c.weight,
      height: c.height,
      head: c.head,
      motor: c.motor,
      speech: c.speech,
      date: todayIso(),
      category: pred.category,
      k: pred.k,
      votes: pred.votes,
      neighbors: pred.neighbors,
      createdBy: user.id,
    }
    d.results.push(r)
    save()
    return resultView(r) as T
  }

  const resultId = idOf(path, '/results')
  if (resultId !== null && method === 'DELETE') {
    need()
    const idx = d.results.findIndex((r) => r.id === resultId)
    if (idx < 0) throw new ApiError('Laporan tidak ditemukan.', 404)
    d.results.splice(idx, 1)
    save()
    return { message: 'Laporan berhasil dihapus.' } as T
  }

  // Akun (admin)
  if (method === 'GET' && path === '/users') {
    need('admin')
    return d.users.map(publicUser) as T
  }

  if (method === 'POST' && path === '/users') {
    need('admin')
    const { errors, value } = validateUser(b)
    if (Object.keys(errors).length) throw new ApiError('Data belum valid.', 400, errors)
    if (d.users.some((u) => u.username === value.username || (value.email && u.email === value.email))) {
      throw new ApiError('Username atau email sudah terdaftar.', 409)
    }
    const u = await addUser(d, {
      name: value.name!,
      username: value.username!,
      email: value.email ?? null,
      role: value.role as Role,
      password: value.password!,
    })
    save()
    return publicUser(u) as T
  }

  const userId = idOf(path, '/users')
  if (userId !== null && method === 'PUT') {
    const me2 = need('admin')
    const u = d.users.find((x) => x.id === userId)
    if (!u) throw new ApiError('Pengguna tidak ditemukan.', 404)
    const { errors, value } = validateUser(b, true)
    if (Object.keys(errors).length) throw new ApiError('Data belum valid.', 400, errors)
    if (userId === me2.id && value.role && value.role !== 'admin') {
      throw new ApiError('Anda tidak dapat menurunkan peran akun sendiri.', 400)
    }
    const clash = d.users.some(
      (x) =>
        x.id !== userId &&
        ((value.username !== undefined && x.username === value.username) ||
          (value.email && x.email === value.email)),
    )
    if (clash) throw new ApiError('Username atau email sudah dipakai akun lain.', 409)

    if (value.name !== undefined) u.name = value.name
    if (value.username !== undefined) u.username = value.username
    if (value.email !== undefined) u.email = value.email
    if (value.role !== undefined) u.role = value.role as Role
    if (value.password !== undefined) {
      u.salt = randomHex()
      u.passwordHash = await hashPassword(value.password, u.salt)
    }
    save()
    return publicUser(u) as T
  }

  if (userId !== null && method === 'DELETE') {
    const me2 = need('admin')
    if (userId === me2.id) throw new ApiError('Anda tidak dapat menghapus akun sendiri.', 400)
    const idx = d.users.findIndex((x) => x.id === userId)
    if (idx < 0) throw new ApiError('Pengguna tidak ditemukan.', 404)
    d.users.splice(idx, 1)
    save()
    return { message: 'Akun berhasil dihapus.' } as T
  }

  throw new ApiError('Endpoint tidak ditemukan.', 404)
}
