export type Category = 'Normal' | 'Risiko Sedang' | 'Risiko Berat'
export const CATEGORIES: Category[] = ['Normal', 'Risiko Sedang', 'Risiko Berat']
export const CATEGORY_COLOR: Record<Category, string> = {
  Normal: '#10b981',
  'Risiko Sedang': '#f59e0b',
  'Risiko Berat': '#f43f5e',
}

export type Gender = 'Perempuan' | 'Laki-laki'
export type Role = 'admin' | 'petugas'

export interface User {
  id: number
  name: string
  username: string
  email: string | null
  role: Role
  createdAt?: string
}

export interface Child {
  id: number
  name: string
  age: number
  gender: Gender
  weight: number
  height: number
  head: number
  motor: number
  speech: number
  lastCategory: Category | null
  lastDate: string | null
}

// Tetangga terdekat hanya berisi peringkat, jarak, dan kategori.
// Nilai fitur data latih tidak pernah dikirim ke browser.
export interface Neighbor {
  rank: number
  distance: number
  category: Category
}

export interface ExamResult {
  id: number | null
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
}

export interface ModelInfo {
  nama: string
  versi: string
  dilatih_pada: string
  algoritma: string
  k: number
  jumlah_data_latih: number
  normalisasi: { metode: string }
  pembagian: { metode: string; rasio_uji: number; jumlah_latih: number; jumlah_uji: number }
  validasi_silang: { fold: number; k_terpilih: number }
  evaluasi_uji: {
    akurasi: number
    makro_f1: number
    baseline_mayoritas: number
  }
}

export const CODE_LABEL: Record<number, string> = {
  1: 'Perlu stimulasi',
  2: 'Cukup sesuai',
  3: 'Sesuai tahap',
}

export const RECOMMENDATION: Record<Category, string> = {
  Normal: 'Lanjutkan pemantauan tumbuh kembang secara berkala sesuai jadwal layanan kesehatan.',
  'Risiko Sedang': 'Tinjau hasil bersama tenaga kesehatan untuk menentukan kebutuhan evaluasi lanjutan.',
  'Risiko Berat': 'Prioritaskan penilaian lebih lanjut oleh tenaga kesehatan.',
}
