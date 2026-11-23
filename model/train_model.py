#!/usr/bin/env python3
"""
Melatih model K-Nearest Neighbors (K-NN) TumbuhRuang dengan kaidah yang benar.

Alur kerja:
  1. Baca data latih (CSV) dan validasi isinya.
  2. Bagi data menjadi data latih (80%) dan data uji (20%) secara berstrata
     (proporsi tiap kategori dijaga). Data uji TIDAK dipakai untuk memilih parameter.
  3. Normalisasi min-max. Nilai min/max dihitung HANYA dari data latih.
  4. Pilih nilai K dengan validasi silang 5-fold stratified pada data latih.
     Normalisasi dihitung ulang di setiap fold agar tidak bocor dari data validasi.
  5. Latih model final dengan K terpilih pada seluruh data latih.
  6. Evaluasi SEKALI pada data uji: akurasi, presisi, recall, F1, matriks kebingungan,
     dibandingkan dengan baseline (selalu menebak kategori terbanyak).
  7. Simpan model ke server/model/knn_model.json (dibaca server, tidak pernah ditampilkan).

Algoritma K-NN di sini harus identik dengan server/knn.js. Jalankan
  node model/verifikasi_js.mjs
untuk memastikan hasil prediksi JavaScript sama dengan Python.

Cara pakai:
  python3 model/train_model.py                       (memakai data dummy)
  python3 model/train_model.py --data model/data/data_saya.csv
"""
import argparse
import csv
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import StratifiedKFold, train_test_split

# ---- Konfigurasi (harus sama dengan server/knn.js) ----
FEATURES = ["age", "weight", "height", "head", "motor", "speech"]
CATEGORIES = ["Normal", "Risiko Sedang", "Risiko Berat"]   # urutan juga dipakai untuk aturan seri
K_CANDIDATES = [1, 3, 5, 7, 9, 11, 13, 15]
TEST_SIZE = 0.2
RANDOM_STATE = 42
CV_FOLDS = 5
MIN_ROWS_RECOMMENDED = 50

ROOT = Path(__file__).resolve().parent
DEFAULT_DATA = ROOT / "data" / "data_latih_dummy.csv"
MODEL_OUT = ROOT.parent / "server" / "model" / "knn_model.json"
VERIFY_OUT = ROOT / "data" / "hasil_uji_python.json"


# ---------------------------------------------------------------------------
def load_data(path):
    rows, labels = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in FEATURES + ["category"] if c not in (reader.fieldnames or [])]
        if missing:
            sys.exit(f"[ERROR] Kolom berikut tidak ditemukan di {path.name}: {', '.join(missing)}")
        for line_no, rec in enumerate(reader, start=2):
            try:
                x = [float(rec[c]) for c in FEATURES]
            except (TypeError, ValueError):
                sys.exit(f"[ERROR] Baris {line_no}: nilai fitur harus angka.")
            y = rec["category"].strip()
            if y not in CATEGORIES:
                sys.exit(f"[ERROR] Baris {line_no}: kategori '{y}' tidak dikenal. Gunakan: {CATEGORIES}")
            if int(x[4]) not in (1, 2, 3) or int(x[5]) not in (1, 2, 3):
                sys.exit(f"[ERROR] Baris {line_no}: kode motorik/bicara harus 1, 2, atau 3.")
            rows.append(x)
            labels.append(y)
    return rows, labels


def fit_minmax(X):
    mins = [min(col) for col in zip(*X)]
    maxs = [max(col) for col in zip(*X)]
    return mins, maxs


def transform(X, mins, maxs):
    out = []
    for row in X:
        out.append([
            (v - mins[j]) / (maxs[j] - mins[j]) if maxs[j] > mins[j] else 0.0
            for j, v in enumerate(row)
        ])
    return out


def knn_predict(train_X, train_y, query_X, k):
    """K-NN identik dengan server/knn.js: jarak Euclidean, sort stabil, voting, seri -> urutan CATEGORIES."""
    results = []
    for q in query_X:
        ranked = []
        for idx, s in enumerate(train_X):
            d2 = 0.0
            for j in range(len(q)):
                diff = q[j] - s[j]
                d2 += diff * diff
            ranked.append((math.sqrt(d2), idx))
        ranked.sort(key=lambda t: t[0])            # sort stabil
        top = ranked[:k]
        votes = {c: 0 for c in CATEGORIES}
        for _, idx in top:
            votes[train_y[idx]] += 1
        best = CATEGORIES[0]
        for c in CATEGORIES:
            if votes[c] > votes[best]:
                best = c
        results.append({
            "category": best,
            "votes": votes,
            "neighbors": [{"rank": i + 1, "distance": d, "category": train_y[idx]} for i, (d, idx) in enumerate(top)],
        })
    return results


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA, help="berkas CSV data latih")
    args = ap.parse_args()

    X, y = load_data(args.data)
    n = len(X)
    print(f"Data dimuat: {n} baris dari {args.data.name}")
    if n < MIN_ROWS_RECOMMENDED:
        print(f"[PERINGATAN] Data kurang dari {MIN_ROWS_RECOMMENDED} baris; hasil model kurang stabil.")
    for c in CATEGORIES:
        print(f"  - {c}: {y.count(c)} baris")

    # 1) Pembagian berstrata
    idx_all = list(range(n))
    idx_tr, idx_te = train_test_split(idx_all, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE)
    Xtr = [X[i] for i in idx_tr]; ytr = [y[i] for i in idx_tr]
    Xte = [X[i] for i in idx_te]; yte = [y[i] for i in idx_te]
    print(f"Pembagian: latih={len(Xtr)}, uji={len(Xte)} (stratified, random_state={RANDOM_STATE})")

    # 2) Validasi silang hanya pada data latih
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_acc = {k: [] for k in K_CANDIDATES}
    for fold_tr, fold_va in skf.split(Xtr, ytr):
        Xf_tr = [Xtr[i] for i in fold_tr]; yf_tr = [ytr[i] for i in fold_tr]
        Xf_va = [Xtr[i] for i in fold_va]; yf_va = [ytr[i] for i in fold_va]
        mins, maxs = fit_minmax(Xf_tr)
        Nf_tr = transform(Xf_tr, mins, maxs)
        Nf_va = transform(Xf_va, mins, maxs)
        for k in K_CANDIDATES:
            preds = [r["category"] for r in knn_predict(Nf_tr, yf_tr, Nf_va, k)]
            cv_acc[k].append(accuracy_score(yf_va, preds))
    cv_mean = {k: sum(v) / len(v) for k, v in cv_acc.items()}
    best_k = max(K_CANDIDATES, key=lambda k: (round(cv_mean[k], 10), -k))   # akurasi tertinggi, seri -> K kecil
    print("Validasi silang (rata-rata akurasi):")
    for k in K_CANDIDATES:
        mark = "  <- terpilih" if k == best_k else ""
        print(f"  K={k:2d}: {cv_mean[k]:.4f}{mark}")

    # 3) Model final: normalisasi & data latih dari seluruh data latih
    mins, maxs = fit_minmax(Xtr)
    Ntr = transform(Xtr, mins, maxs)
    Nte = transform(Xte, mins, maxs)

    # 4) Evaluasi sekali pada data uji
    test_results = knn_predict(Ntr, ytr, Nte, best_k)
    y_pred = [r["category"] for r in test_results]
    acc = accuracy_score(yte, y_pred)
    prec, rec, f1, sup = precision_recall_fscore_support(yte, y_pred, labels=CATEGORIES, zero_division=0)
    mp, mr, mf, _ = precision_recall_fscore_support(yte, y_pred, labels=CATEGORIES, average="macro", zero_division=0)
    cm = confusion_matrix(yte, y_pred, labels=CATEGORIES).tolist()
    majority = max(set(ytr), key=lambda c: (ytr.count(c), -CATEGORIES.index(c)))
    baseline = sum(1 for t in yte if t == majority) / len(yte)

    print(f"\nEvaluasi pada data uji (K={best_k}):")
    print(f"  Akurasi          : {acc:.4f}")
    print(f"  Makro presisi    : {mp:.4f}")
    print(f"  Makro recall     : {mr:.4f}")
    print(f"  Makro F1         : {mf:.4f}")
    print(f"  Baseline mayoritas: {baseline:.4f} (kategori '{majority}')")
    print("  Matriks kebingungan (baris = sebenarnya, kolom = prediksi):")
    print("                 " + "  ".join(f"{c[:12]:>12}" for c in CATEGORIES))
    for c, row in zip(CATEGORIES, cm):
        print(f"  {c:>14} " + "  ".join(f"{v:>12d}" for v in row))

    # 5) Simpan model
    model = {
        "nama": "TumbuhRuang K-NN",
        "versi": "1.0.0",
        "dilatih_pada": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "algoritma": "K-Nearest Neighbors, jarak Euclidean, voting mayoritas",
        "fitur": FEATURES,
        "kategori": CATEGORIES,
        "k": best_k,
        "normalisasi": {"metode": "min-max, dihitung dari data latih", "min": mins, "max": maxs},
        "aturan_seri": "Jika jumlah suara sama, kategori yang lebih awal pada urutan kategori dipilih (Normal, Risiko Sedang, Risiko Berat).",
        "sumber_data": {
            "berkas": args.data.name,
            "jumlah_baris": n,
            "catatan": "Data dummy/sintetis untuk uji coba. Ganti dengan data latih asli bila tersedia.",
        },
        "pembagian": {
            "metode": "holdout berstrata",
            "rasio_uji": TEST_SIZE,
            "random_state": RANDOM_STATE,
            "jumlah_latih": len(Xtr),
            "jumlah_uji": len(Xte),
        },
        "validasi_silang": {
            "fold": CV_FOLDS,
            "kandidat_k": K_CANDIDATES,
            "akurasi_rata_rata": {str(k): round(v, 6) for k, v in cv_mean.items()},
            "k_terpilih": best_k,
        },
        "evaluasi_uji": {
            "akurasi": round(acc, 6),
            "makro_presisi": round(mp, 6),
            "makro_recall": round(mr, 6),
            "makro_f1": round(mf, 6),
            "per_kategori": {
                c: {"presisi": round(float(prec[i]), 6), "recall": round(float(rec[i]), 6),
                    "f1": round(float(f1[i]), 6), "jumlah": int(sup[i])}
                for i, c in enumerate(CATEGORIES)
            },
            "matriks_kebingungan": {"label": CATEGORIES, "baris_sebenarnya_kolom_prediksi": cm},
            "baseline_mayoritas": round(baseline, 6),
        },
        # Data latih ternormalisasi. Hanya dibaca server untuk klasifikasi.
        # Tidak pernah dikirim ke browser dan tidak bisa diubah lewat aplikasi.
        "data_latih_ternormalisasi": {"x": Ntr, "y": ytr},
    }
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_OUT, "w", encoding="utf-8") as f:
        json.dump(model, f, ensure_ascii=False)
    print(f"\nModel disimpan ke {MODEL_OUT.relative_to(ROOT.parent)}")

    # 6) Berkas pembanding untuk verifikasi JavaScript (khusus pengembang, tidak dipakai server)
    verify = {
        "k": best_k,
        "mins": mins, "maxs": maxs,
        "uji": [
            {"input": dict(zip(FEATURES, Xte[i])), "kategori": test_results[i]["category"],
             "votes": test_results[i]["votes"], "neighbors": test_results[i]["neighbors"]}
            for i in range(len(Xte))
        ],
    }
    with open(VERIFY_OUT, "w", encoding="utf-8") as f:
        json.dump(verify, f, ensure_ascii=False)
    print(f"Berkas verifikasi (pengembang) ditulis ke {VERIFY_OUT.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
