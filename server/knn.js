// Klasifikasi K-Nearest Neighbors (K-NN) menggunakan model yang dilatih di luar aplikasi
// (lihat model/train_model.py). File model dibaca sekali saat server berjalan.
//
// Data latih TIDAK pernah dikirim ke browser dan tidak bisa diubah lewat aplikasi.
// Fungsi di sini harus identik dengan train_model.py (urutan operasi, normalisasi,
// aturan seri) agar hasilnya bisa diverifikasi dengan model/verifikasi_js.mjs.

import modelFile from './model/knn_model.json' with { type: 'json' }

export const MODEL_INFO = modelFile
export const CATEGORIES = modelFile.kategori
export const FEATURES = modelFile.fitur
export const K = modelFile.k

const { min: MIN, max: MAX } = modelFile.normalisasi
const TRAIN_X = modelFile.data_latih_ternormalisasi.x
const TRAIN_Y = modelFile.data_latih_ternormalisasi.y

// Normalisasi min-max memakai nilai min/max dari data latih.
export function normalize(input) {
  return FEATURES.map((f, j) => {
    const range = MAX[j] - MIN[j]
    return range > 0 ? (Number(input[f]) - MIN[j]) / range : 0
  })
}

// Mengembalikan kategori, jumlah suara, dan K tetangga terdekat.
// Data latih tidak ikut dikembalikan; tetangga hanya berisi peringkat, jarak, dan kategori.
export function classify(input, k = K) {
  const x = normalize(input)
  const ranked = TRAIN_X.map((s, idx) => {
    let d2 = 0
    for (let j = 0; j < x.length; j++) {
      const diff = x[j] - s[j]
      d2 += diff * diff
    }
    return { category: TRAIN_Y[idx], distance: Math.sqrt(d2) }
  }).sort((a, b) => a.distance - b.distance)

  const top = ranked.slice(0, k)
  const votes = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  top.forEach((r) => {
    votes[r.category] += 1
  })
  const category = CATEGORIES.reduce((best, c) => (votes[c] > votes[best] ? c : best), CATEGORIES[0])

  return {
    category,
    votes,
    k,
    neighbors: top.map((r, i) => ({ rank: i + 1, distance: r.distance, category: r.category })),
  }
}
