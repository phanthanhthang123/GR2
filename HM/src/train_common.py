"""
Single-threshold Logistic Regression Pipeline.

Huấn luyện 1 Logistic Regression duy nhất tại ngưỡng KPI >= 0.5.
Khi predict: Dùng trực tiếp xác suất của lớp positive (KPI >= 0.5) làm điểm KPI liên tục.
"""
from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from src.utils import ensure_dirs, model_path


def train_single_threshold_lr(
    csv_path,
    feature_columns: list[str],
    model_key: str,
    threshold: float = 0.5,
    random_state: int = 42,
):
    """
    Huấn luyện một mô hình Logistic Regression tại ngưỡng chỉ định (mặc định 0.5).
    Lưu bundle gồm scaler + classifier vào models/model_{key}.pkl.
    """
    ensure_dirs()

    df = pd.read_csv(csv_path)
    X = df[feature_columns].values
    kpi_values = df["KPI"].values

    # Fit scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Nhãn nhị phân
    y_bin = (kpi_values >= threshold).astype(int)

    clf = LogisticRegression(
        max_iter=2000,
        random_state=random_state,
        solver="lbfgs",
    )
    clf.fit(X_scaled, y_bin)

    bundle = {
        "scaler": scaler,
        "classifier": clf,
        "threshold": threshold,
        "feature_columns": feature_columns,
        "model_type": "single_threshold_lr",
        "n_samples": len(df),
    }

    out = model_path(model_key)
    joblib.dump(bundle, out)
    print(f"  [train] Đã lưu model {model_key} → {out} (samples={len(df)})")
    return bundle

