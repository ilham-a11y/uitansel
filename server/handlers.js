// Logika server yang TIDAK membutuhkan database.
// Dipakai oleh fungsi Vercel (api/*.js) dan server lokal (server/index.js).
//
// Server hanya menyediakan dua hal:
//   1. klasifikasi K-NN dari fitur yang dikirim browser
//   2. ringkasan model (tanpa isi data latih)
// Data anak, akun, dan hasil disimpan di browser (localStorage).

import { classify, FEATURES, K, MODEL_INFO } from './knn.js'

const GENDERS = ['Perempuan', 'Laki-laki']

// Aturan input sama dengan validasi di browser.
export function validatePredictInput(body = {}) {
  const errors = {}
  const age = Number(body.age)
  if (!Number.isInteger(age) || age < 0 || age > 72) errors.age = 'Usia harus berupa bilangan bulat 0–72 bulan.'
  const weight = Number(body.weight)
  if (!(weight >= 1 && weight <= 30)) errors.weight = 'Berat badan harus 1–30 kg.'
  const height = Number(body.height)
  if (!(height >= 30 && height <= 150)) errors.height = 'Tinggi badan harus 30–150 cm.'
  const head = Number(body.head)
  if (!(head >= 25 && head <= 65)) errors.head = 'Lingkar kepala harus 25–65 cm.'
  const motor = Number(body.motor)
  if (![1, 2, 3].includes(motor)) errors.motor = 'Kode motorik harus 1, 2, atau 3.'
  const speech = Number(body.speech)
  if (![1, 2, 3].includes(speech)) errors.speech = 'Kode bicara harus 1, 2, atau 3.'
  return { errors, value: { age, weight, height, head, motor, speech } }
}

export function handlePredict(body) {
  const { errors, value } = validatePredictInput(body)
  if (Object.keys(errors).length) {
    return { status: 400, body: { message: 'Data tidak valid.', errors } }
  }
  return { status: 200, body: classify(value, K) }
}

// Ringkasan model untuk ditampilkan di aplikasi. Data latih dan nilai min/max tidak disertakan.
export function publicModelInfo() {
  const { data_latih_ternormalisasi: train, normalisasi, ...rest } = MODEL_INFO
  return {
    ...rest,
    normalisasi: { metode: normalisasi.metode },
    jumlah_data_latih: train.y.length,
  }
}

export { FEATURES, GENDERS }
