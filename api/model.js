// Fungsi Vercel: GET /api/model  -> ringkasan model (tanpa data latih)
import { publicModelInfo } from '../server/handlers.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Metode tidak diizinkan.' })
  }
  return res.status(200).json(publicModelInfo())
}
