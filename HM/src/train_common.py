"""
Multi-threshold Logistic Regression Pipeline.

Thay vì 1 ngưỡng nhị phân (>= 0.5 → 1), ta train 9 Logistic Regression
tại các ngưỡng [0.1, 0.2, ..., 0.9].

Khi predict: KPI ≈ step × (1 + Σ P(KPI ≥ tₖ))
→ Tạo ra giá trị liên tục [0, 1] phản ánh đúng năng lực.

Ý tưởng: E[Y] = ∫₀¹ P(Y ≥ t) dt ≈ step × Σ P(Y ≥ tₖ)
(Ordinal decomposition / Frank & Hall method)
"""
from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from src.utils import KPI_THRESHOLDS, ensure_dirs, model_path


def train_multi_threshold_lr(
    csv_path,
    feature_columns: list[str],
    model_key: str,
    thresholds: list[float] | None = None,
    random_state: int = 42,
):
    """
    Train 9 Logistic Regression classifiers tại các ngưỡng KPI khác nhau.
    Lưu bundle gồm scaler + danh sách classifiers vào models/model_{key}.pkl.
    """
    ensure_dirs()
    if thresholds is None:
        thresholds = KPI_THRESHOLDS

    df = pd.read_csv(csv_path)
    X = df[feature_columns].values
    kpi_values = df["KPI"].values

    # Fit scaler 1 lần, dùng chung cho tất cả classifiers
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    classifiers = []
    threshold_stats = []

    for t in thresholds:
        y_bin = (kpi_values >= t).astype(int)
        n_pos = int(y_bin.sum())
        n_neg = int(len(y_bin) - n_pos)

        # Cần cả 2 class để train Logistic Regression
        if n_pos < 5 or n_neg < 5:
            print(f"  [threshold={t:.1f}] Bỏ qua — lớp thiểu số quá ít (pos={n_pos}, neg={n_neg})")
            classifiers.append(None)
            threshold_stats.append({"threshold": t, "skipped": True})
            continue

        clf = LogisticRegression(
            max_iter=2000,
            random_state=random_state,
            solver="lbfgs",
        )
        clf.fit(X_scaled, y_bin)
        classifiers.append(clf)
        threshold_stats.append({
            "threshold": t,
            "skipped": False,
            "n_positive": n_pos,
            "n_negative": n_neg,
        })

    active_count = sum(1 for c in classifiers if c is not None)
    print(f"  [Model {model_key}] Đã train {active_count}/{len(thresholds)} classifiers")

    bundle = {
        "scaler": scaler,
        "classifiers": classifiers,
        "thresholds": thresholds,
        "feature_columns": feature_columns,
        "model_type": "multi_threshold_lr",
        "n_samples": len(df),
        "threshold_stats": threshold_stats,
    }

    out = model_path(model_key)
    joblib.dump(bundle, out)
    print(f"  [train] Đã lưu model → {out} (samples={len(df)}, thresholds={active_count})")
    return bundle
