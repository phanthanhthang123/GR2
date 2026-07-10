import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.utils import DATA_DIR, OUTPUT_DIR, ensure_dirs, model_path

def evaluate_and_plot():
    ensure_dirs()
    
    # 1. EVALUATE MODEL A & B REGRESSION METRICS
    features_a = ["cpa", "interview_score", "CV_score", "num_projects", "years_experience"]
    features_b = ["total_projects", "total_tasks", "hard_tasks", "years_at_company"]
    
    # Load datasets
    df_a = pd.read_csv(DATA_DIR / "data_A.csv")
    df_b = pd.read_csv(DATA_DIR / "data_B.csv")
    
    # Split
    _, X_test_a, _, y_test_a = train_test_split(df_a[features_a].values, df_a["KPI"].values, test_size=0.2, random_state=42)
    _, X_test_b, _, y_test_b = train_test_split(df_b[features_b].values, df_b["KPI"].values, test_size=0.2, random_state=42)
    
    # Helper to predict from trained model
    def get_predictions(model_key, X_test):
        p = model_path(model_key)
        bundle = joblib.load(p)
        scaler = bundle["scaler"]
        clf = bundle["classifier"]
        X_scaled = scaler.transform(X_test)
        probas = clf.predict_proba(X_scaled)[:, 1]
        return np.clip(probas, 0.0, 1.0)

        
    y_pred_a = get_predictions("A", X_test_a)
    y_pred_b = get_predictions("B", X_test_b)
    
    mae_a = mean_absolute_error(y_test_a, y_pred_a)
    rmse_a = np.sqrt(mean_squared_error(y_test_a, y_pred_a))
    r2_a = r2_score(y_test_a, y_pred_a)
    
    mae_b = mean_absolute_error(y_test_b, y_pred_b)
    rmse_b = np.sqrt(mean_squared_error(y_test_b, y_pred_b))
    r2_b = r2_score(y_test_b, y_pred_b)
    
    # 2. LOAD RANDOM FOREST PROJECT DELAY CLASSIFICATION METRICS
    rf_path = ROOT / "models" / "rf_project_delay.pkl"
    rf_bundle = joblib.load(rf_path)
    rf_report = rf_bundle["classification_report"]
    rf_acc = rf_bundle["accuracy"]
    
    # Setup plotting: 2 subplots (1 for regression, 1 for classification)
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Subplot 1: Regression Metrics for Model A & B
    x = np.arange(3)
    width = 0.35
    
    # Scale R2 to [0,1] for visualization alongside MAE/RMSE
    axes[0].bar(x - width/2, [mae_a, rmse_a, r2_a], width, label='Model A (Onboarding)', color='#3498db')
    axes[0].bar(x + width/2, [mae_b, rmse_b, r2_b], width, label='Model B (Internal)', color='#2ecc71')
    
    axes[0].set_title('Chỉ số đánh giá mô hình KPI User (Hồi quy)', fontsize=12, fontweight='bold', pad=15)
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(['MAE (Sai số tuyệt đối)', 'RMSE (Sai số bình phương)', 'R² (Hệ số xác định)'], fontsize=10)
    min_y = min(0.0, r2_a, r2_b) - 0.2
    axes[0].set_ylim(min_y, 1.1)
    axes[0].grid(axis='y', linestyle='--', alpha=0.7)
    axes[0].legend(loc='upper right')
    
    # Add values on top of bars
    for i, val in enumerate([mae_a, rmse_a, r2_a]):
        va = 'bottom' if val >= 0 else 'top'
        y_pos = val + 0.02 if val >= 0 else val - 0.05
        axes[0].text(i - width/2, y_pos, f'{val:.4f}', ha='center', va=va, fontsize=9, fontweight='bold')
    for i, val in enumerate([mae_b, rmse_b, r2_b]):
        va = 'bottom' if val >= 0 else 'top'
        y_pos = val + 0.02 if val >= 0 else val - 0.05
        axes[0].text(i + width/2, y_pos, f'{val:.4f}', ha='center', va=va, fontsize=9, fontweight='bold')

        
    # Subplot 2: Classification Metrics for Project Delay (Random Forest)
    classes = ['Low', 'Medium', 'High']
    precisions = [rf_report[cls]['precision'] for cls in classes]
    recalls = [rf_report[cls]['recall'] for cls in classes]
    f1s = [rf_report[cls]['f1-score'] for cls in classes]
    
    x_clf = np.arange(len(classes))
    width_clf = 0.25
    
    axes[1].bar(x_clf - width_clf, precisions, width_clf, label='Precision', color='#e74c3c')
    axes[1].bar(x_clf, recalls, width_clf, label='Recall', color='#f1c40f')
    axes[1].bar(x_clf + width_clf, f1s, width_clf, label='F1-Score', color='#9b59b6')
    
    axes[1].set_title('Chỉ số đánh giá mô hình Rủi ro Dự án (Phân loại RF)', fontsize=12, fontweight='bold', pad=15)
    axes[1].set_xticks(x_clf)
    axes[1].set_xticklabels([f'{cls} Risk' for cls in classes], fontsize=10)
    axes[1].set_ylim(0, 1.1)
    axes[1].grid(axis='y', linestyle='--', alpha=0.7)
    axes[1].legend(loc='lower right')
    
    # Add accuracy line/text
    axes[1].axhline(y=rf_acc, color='grey', linestyle='-.', alpha=0.5)
    axes[1].text(0.5, rf_acc + 0.02, f'Accuracy toàn cục: {rf_acc*100:.1f}%', ha='center', color='#2c3e50', fontweight='bold')
    
    # Add values on top of bars
    for i in range(len(classes)):
        axes[1].text(i - width_clf, precisions[i] + 0.02, f'{precisions[i]:.2f}', ha='center', va='bottom', fontsize=8)
        axes[1].text(i, recalls[i] + 0.02, f'{recalls[i]:.2f}', ha='center', va='bottom', fontsize=8)
        axes[1].text(i + width_clf, f1s[i] + 0.02, f'{f1s[i]:.2f}', ha='center', va='bottom', fontsize=8)
        
    plt.suptitle('Đánh giá chất lượng mô hình học máy (Tập Test)', fontsize=14, fontweight='bold', y=0.98)
    plt.tight_layout()
    
    out_img = OUTPUT_DIR / "evaluation_metrics.png"
    plt.savefig(out_img, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[evaluate_and_plot] Đã tạo biểu đồ đẹp mắt tại: {out_img}")

if __name__ == "__main__":
    evaluate_and_plot()
