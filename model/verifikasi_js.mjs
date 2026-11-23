// Memverifikasi bahwa klasifikasi JavaScript (server/knn.js) identik dengan Python (train_model.py).
// Jalankan dari folder proyek:  node model/verifikasi_js.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classify } from '../server/knn.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const ref = JSON.parse(fs.readFileSync(path.join(here, 'data', 'hasil_uji_python.json'), 'utf8'))

let mismatch = 0
let maxDiff = 0
for (const t of ref.uji) {
  const js = classify(t.input, ref.k)
  const sameCat = js.category === t.kategori
  const sameVotes = JSON.stringify(js.votes) === JSON.stringify(t.votes)
  const sameNeighbors = js.neighbors.length === t.neighbors.length && js.neighbors.every((n, i) => {
    const p = t.neighbors[i]
    maxDiff = Math.max(maxDiff, Math.abs(n.distance - p.distance))
    return n.rank === p.rank && n.category === p.category
  })
  if (!(sameCat && sameVotes && sameNeighbors)) mismatch++
}
console.log(`Data uji diperiksa : ${ref.uji.length}`)
console.log(`K                  : ${ref.k}`)
console.log(`Selisih kategori/suara/tetangga: ${mismatch}`)
console.log(`Selisih jarak maksimum        : ${maxDiff}`)
console.log(mismatch === 0 ? 'OK: JavaScript identik dengan Python.' : 'GAGAL: ada perbedaan.')
process.exitCode = mismatch === 0 ? 0 : 1
