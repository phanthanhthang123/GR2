"""
Huấn luyện Pipeline(StandardScaler + LogisticRegression).
Nhãn nhị phân: KPI >= threshold → 1 (xác suất lớp 1 dùng làm score 0–1).
"""
from __future__ import annotations

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from src.utils import ensure_dirs, model_path


def train_logistic_kpi_pipeline(
    csv_path,
    feature_columns: list[str],
    model_key: str,
    kpi_threshold: float = 0.5,
    random_state: int = 42,
) -> Pipeline:
    """
    Đọc CSV, fit pipeline, lưu joblib vào models/model_{key}.pkl.
    """
    ensure_dirs()
    df = pd.read_csv(csv_path)
    X = df[feature_columns].values
    y = (df["KPI"] >= kpi_threshold).astype(int).values

    pipe = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "clf",
                LogisticRegression(
                    max_iter=2000,
                    random_state=random_state,
                    solver="lbfgs",
                ),
            ),
        ]
    )
    pipe.fit(X, y)
    out = model_path(model_key)
    joblib.dump(
        {
            "pipeline": pipe,
            "feature_columns": feature_columns,
            "kpi_threshold": kpi_threshold,
        },
        out,
    )
    print(f"[train] Đã lưu model → {out} (samples={len(df)})")
    return pipe
