"""
Đánh giá chất lượng Multi-threshold Logistic Regression.
So sánh KPI dự đoán (liên tục) vs KPI thực tế trong CSV.
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Add HM root to sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.train_common import train_single_threshold_lr
from src.utils import DATA_DIR


def _predict_kpi_from_bundle(bundle, X):
    """Predict KPI cho nhiều samples cùng lúc dùng xác suất Logistic Regression đơn ngưỡng."""
    scaler = bundle["scaler"]
    clf = bundle["classifier"]
    X_scaled = scaler.transform(X)
    # Lấy xác suất của lớp positive (KPI >= 0.5) làm điểm dự báo KPI thô
    probas = clf.predict_proba(X_scaled)[:, 1]
    return np.clip(probas, 0.0, 1.0)


def evaluate_model(csv_path, feature_columns, name):
    print(f"\n=================== EVALUATING MODEL {name} ===================")
    df = pd.read_csv(csv_path)
    X = df[feature_columns].values
    y_true = df["KPI"].values

    # 1. Split train-test 80-20
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_true, test_size=0.2, random_state=42
    )

    # 2. Train trên tập train (lưu tạm)
    train_df = pd.DataFrame(X_train, columns=feature_columns)
    train_df["KPI"] = y_train
    tmp_path = DATA_DIR / f"_eval_tmp_{name}.csv"
    train_df.to_csv(tmp_path, index=False)

    bundle = train_single_threshold_lr(tmp_path, feature_columns, f"_eval_{name}")
    tmp_path.unlink(missing_ok=True)  # xóa file tạm

    # 3. Predict trên tập test
    y_pred = _predict_kpi_from_bundle(bundle, X_test)


    # 4. Metrics hồi quy
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print(f"Test MAE  : {mae:.4f}")
    print(f"Test RMSE : {rmse:.4f}")
    print(f"Test R²   : {r2:.4f} ({r2*100:.2f}%)")

    # 5. Phân tích theo dải KPI
    print("\nPhân tích theo dải KPI:")
    bins = [(0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)]
    for lo, hi in bins:
        mask = (y_test >= lo) & (y_test < hi)
        if mask.sum() == 0:
            continue
        seg_mae = mean_absolute_error(y_test[mask], y_pred[mask])
        seg_mean_true = y_test[mask].mean()
        seg_mean_pred = y_pred[mask].mean()
        print(f"  [{lo:.1f}-{hi:.1f}) n={mask.sum():4d} | MAE={seg_mae:.4f} | "
              f"Mean true={seg_mean_true:.4f} pred={seg_mean_pred:.4f}")

    # 6. Ví dụ một vài dự đoán
    print("\nVí dụ 10 dự đoán:")
    indices = np.random.RandomState(42).choice(len(y_test), min(10, len(y_test)), replace=False)
    for idx in indices:
        print(f"  True={y_test[idx]:.4f}  Pred={y_pred[idx]:.4f}  Δ={abs(y_test[idx]-y_pred[idx]):.4f}")

    # Cleanup temp model
    from src.utils import model_path
    model_path(f"_eval_{name}").unlink(missing_ok=True)


if __name__ == "__main__":
    FEATURES_A = ["cpa", "interview_score", "CV_score", "num_projects", "years_experience"]
    FEATURES_B = ["total_projects", "total_tasks", "hard_tasks", "years_at_company"]

    evaluate_model(DATA_DIR / "data_A.csv", FEATURES_A, "A (Onboarding)")
    evaluate_model(DATA_DIR / "data_B.csv", FEATURES_B, "B (Internal)")
