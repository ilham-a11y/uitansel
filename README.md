# TumbuhRuang v4 — Versi Skripsi (tanpa database)

Aplikasi pemantauan tumbuh kembang anak untuk petugas posyandu, dengan klasifikasi
K-Nearest Neighbors (K-NN). Versi ini **tidak memakai database dan tidak memerlukan
environment variable**, sehingga cukup diunggah ke Vercel.

## Cara kerja data

| Bagian | Disimpan di | Keterangan |
|---|---|---|
| Akun, data anak, hasil klasifikasi | Browser (localStorage) | Data hanya ada di browser tempat aplikasi dibuka |
| Klasifikasi K-NN | Server (`/api/predict`) | Model dan data latih tidak pernah dikirim ke browser |
| Ringkasan model | Server (`/api/model`) | Tanpa isi data latih |

Akibatnya:
- Admin dan petugas harus memakai **browser yang sama** agar bisa saling melihat data.
- Menghapus data situs atau memakai browser/perangkat lain membuat data tidak ikut.
- Password disimpan sebagai hash SHA-256 dengan garam di browser.

## Akun awal

| Username | Kata sandi | Peran |
|---|---|---|
| admin | admin123 | Administrator |
| user | user123 | Petugas Posyandu |

Admin dapat mengganti kata sandi akun melalui menu **Kelola Akun**.

## Peran

- **Petugas**: tambah, ubah, dan hapus data anak; menjalankan klasifikasi; menyimpan dan menghapus hasil.
- **Admin**: mengelola akun (tambah, ubah termasuk reset kata sandi, hapus); melihat dan menghapus data anak dan hasil klasifikasi. Admin tidak dapat menambah atau mengubah data anak dan tidak dapat menjalankan klasifikasi.

## Deploy ke Vercel

1. Upload folder proyek ke Vercel (atau hubungkan repository GitHub).
2. Framework: **Vite**. Build command `npm run build` dan output `dist` sudah diatur.
3. Tidak perlu mengisi Environment Variables.
4. Klik **Deploy**.

Fungsi di folder `api/` (`predict.js` dan `model.js`) otomatis menjadi endpoint `/api/predict` dan `/api/model`.

## Menjalankan di komputer sendiri

```
npm install
npm run build
npm start
```

Buka http://localhost:3001. Untuk pengembangan dengan hot reload, jalankan `npm run server` dan `npm run dev` di dua terminal.

## Model K-NN dan data latih

Model dilatih di luar aplikasi dengan `model/train_model.py`, mengikuti kaidah yang benar:
pembagian data latih/uji berstrata (80/20), normalisasi min-max dari data latih saja,
pemilihan K dengan validasi silang 5-fold, dan evaluasi sekali pada data uji.

- Data dummy (sintetis, 150 baris) ada di `model/data/data_latih_dummy.csv`.
- Ganti dengan data asli dengan kolom `age,weight,height,head,motor,speech,category`, lalu jalankan:
  ```
  pip install numpy scikit-learn
  python model/train_model.py --data model/data/data_saya.csv
  ```
- Verifikasi bahwa JavaScript identik dengan Python: `npm run model:verify`.

Setelah model dilatih ulang, deploy ulang aplikasi.

## Struktur

```
api/predict.js               fungsi Vercel: klasifikasi K-NN
api/model.js                 fungsi Vercel: ringkasan model
server/handlers.js           logika predict & ringkasan model (tanpa database)
server/knn.js                algoritma K-NN (membaca model)
server/model/knn_model.json  model terlatih (data latih ternormalisasi)
server/index.js              server lokal (API + dist)
src/lib/local-api.ts         penyimpanan data di browser + aturan peran
model/                       skrip pelatihan, data dummy, verifikasi
```

## Catatan
- Hasil klasifikasi merupakan pendukung skrining awal, bukan diagnosis medis.
- Data dummy tidak mewakili populasi nyata. Akurasi pada data dummy hanya menunjukkan bahwa pipeline berjalan benar.
