// Server lokal untuk pengembangan (npm start / npm run server).
// Di Vercel, file di folder api/ yang dipakai, bukan file ini.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { handlePredict, publicModelInfo } from './handlers.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(here, '..', 'dist')
const port = Number(process.env.PORT || 3001)

const app = express()
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.get('/api/model', (req, res) => res.json(publicModelInfo()))
app.post('/api/predict', (req, res) => {
  const out = handlePredict(req.body ?? {})
  res.status(out.status).json(out.body)
})
app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }))

if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
} else {
  console.log('[TumbuhRuang] Folder dist belum ada. Jalankan "npm run build" atau gunakan "npm run dev".')
}

app.listen(port, () => console.log(`[TumbuhRuang] Server berjalan di http://localhost:${port}`))
