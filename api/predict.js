// Fungsi Vercel: POST /api/predict  -> hasil klasifikasi K-NN
import { handlePredict } from '../server/handlers.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Metode tidak diizinkan.' })
  }
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ message: 'Format data tidak valid.' })
    }
  }
  const out = handlePredict(body ?? {})
  return res.status(out.status).json(out.body)
}
