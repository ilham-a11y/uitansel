#!/usr/bin/env python3
"""
Membuat data DUMMY (sintetis) untuk melatih model K-NN TumbuhRuang.

PENTING: data ini bukan data pasien nyata. Gunakan hanya untuk uji coba.
Ganti dengan data latih asli Anda (format kolom sama) lalu jalankan train_model.py.

Setiap kategori dibuat dengan pola pertumbuhan yang berbeda, lalu ditambahkan
derau (noise) agar kategori saling tumpang tindih seperti data nyata.
Jumlah: 50 baris per kategori = 150 baris.
"""
import csv
import random
from pathlib import Path

SEED = 20261123
PER_CLASS = 50
OUT = Path(__file__).resolve().parent / "data" / "data_latih_dummy.csv"

# Parameter pola per kategori: (selisih berat, selisih tinggi, selisih lingkar kepala,
# peluang kode motorik/bicara 1, 2, 3)
PROFILES = {
    "Normal":         dict(dw=0.0,  dh=0.0,  dk=0.0,  p=(0.05, 0.15, 0.80)),
    "Risiko Sedang":  dict(dw=-0.9, dh=-2.5, dk=-0.8, p=(0.15, 0.70, 0.15)),
    "Risiko Berat":   dict(dw=-2.1, dh=-5.0, dk=-1.7, p=(0.70, 0.20, 0.10)),
}


def sample_code(rng, probs):
    r = rng.random()
    acc = 0.0
    for code, p in zip((1, 2, 3), probs):
        acc += p
        if r < acc:
            return code
    return 3


def main():
    rng = random.Random(SEED)
    rows = []
    for category, prof in PROFILES.items():
        for _ in range(PER_CLASS):
            age = rng.randint(12, 48)                       # usia dalam bulan
            weight = 6.5 + 0.17 * age + prof["dw"] + rng.gauss(0, 0.7)
            height = 72.0 + 0.5 * age + prof["dh"] + rng.gauss(0, 2.0)
            head = 44.0 + 0.12 * age + prof["dk"] + rng.gauss(0, 0.6)
            motor = sample_code(rng, prof["p"])
            speech = sample_code(rng, prof["p"])
            rows.append({
                "age": age,
                "weight": round(weight, 1),
                "height": round(height, 1),
                "head": round(head, 1),
                "motor": motor,
                "speech": speech,
                "category": category,
            })
    rng.shuffle(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["age", "weight", "height", "head", "motor", "speech", "category"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Berhasil membuat {len(rows)} baris data dummy -> {OUT}")


if __name__ == "__main__":
    main()
