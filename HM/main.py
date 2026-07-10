"""
HM — Hệ thống KPI user (2 model Logistic Regression: A onboarding, B nội bộ).

Chạy từ thư mục HM:
    pip install -r requirements.txt
    python main.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from src.generate_data import generate_all
from src.generate_project_data import generate_project_data
from src.kpi_history import log_kpi_event
from src.plot_kpi import plot_kpi_distributions
from src.predict import UserInternalInput, UserOnboardingInput, predict_kpi_full, ProjectInput, predict_project_delay
from src.train_model_A_lr import train as train_a
from src.train_model_B_lr import train as train_b
from src.train_model_rf import train_rf
from src.utils import ensure_dirs


def main() -> None:
    ensure_dirs()
    print("=== Bước 1: Sinh dữ liệu CSV (nếu chưa có) ===")
    generate_all(force=False)
    generate_project_data(force=False)

    print("\n=== Bước 2: Huấn luyện Model ===")
    print("-> Đang huấn luyện Logistic Regression (KPI User)...")
    train_a()
    train_b()
    print("-> Đang huấn luyện Random Forest (Project Delay)...")
    train_rf()


    print("\n=== Bước 3: Bonus — biểu đồ phân phối KPI ===")
    plot_kpi_distributions()

    print("\n=== Bước 4: Ví dụ KPI khi tạo account & sau 1 quý ===")
    demo_user_id = "user_demo_001"

    # Test case 1: Sinh viên mới, CPA khá, không có KN
    cold_onb = UserOnboardingInput(
        cpa=3.24,
        interview_score=7.2,
        cv_score=7.3,
        years_experience=0.0,
        num_projects=0.0,
    )
    kpi_cold, m_cold = predict_kpi_full(
        is_internal_employee=False,
        onboarding=cold_onb,
    )
    print(f"\n[SV mới — CPA 3.24, IV 7.2, CV 7.3, 0 năm, 0 project] Model {m_cold}, KPI = {kpi_cold:.4f}")

    # Test case 2: Có kinh nghiệm
    exp_onb = UserOnboardingInput(
        cpa=3.4,
        interview_score=7.5,
        cv_score=8.0,
        years_experience=5.0,
        num_projects=12.0,
    )
    kpi_exp, m_exp = predict_kpi_full(
        is_internal_employee=False,
        onboarding=exp_onb,
    )
    print(f"[Có KN — CPA 3.4, IV 7.5, CV 8.0, 5 năm, 12 proj] Model {m_exp}, KPI = {kpi_exp:.4f}")

    # Test case 3: Ứng viên xuất sắc
    top_onb = UserOnboardingInput(
        cpa=3.8,
        interview_score=9.0,
        cv_score=9.2,
        years_experience=8.0,
        num_projects=25.0,
    )
    kpi_top, m_top = predict_kpi_full(
        is_internal_employee=False,
        onboarding=top_onb,
    )
    print(f"[Xuất sắc — CPA 3.8, IV 9.0, CV 9.2, 8 năm, 25 proj] Model {m_top}, KPI = {kpi_top:.4f}")

    # Test case 4: Ứng viên yếu
    weak_onb = UserOnboardingInput(
        cpa=2.2,
        interview_score=3.5,
        cv_score=3.0,
        years_experience=0.0,
        num_projects=0.0,
    )
    kpi_weak, m_weak = predict_kpi_full(
        is_internal_employee=False,
        onboarding=weak_onb,
    )
    print(f"[Yếu — CPA 2.2, IV 3.5, CV 3.0, 0 năm, 0 proj] Model {m_weak}, KPI = {kpi_weak:.4f}")

    # Test case 5: Nội bộ
    internal_stats = UserInternalInput(
        total_projects=10,
        total_tasks=160,
        hard_tasks=45,
        years_at_company=2.5,
    )
    kpi_quarter, model_b = predict_kpi_full(
        is_internal_employee=True,
        internal=internal_stats,
    )
    print(f"[Sau 1 quý — Nội bộ] Model {model_b}, KPI = {kpi_quarter:.4f}")
    log_kpi_event(demo_user_id, kpi_cold, m_cold, "account_created_cold")
    log_kpi_event(demo_user_id, kpi_quarter, model_b, "quarterly_update")

    print("\n=== Bước 5: Ví dụ Dự đoán Trễ tiến độ Dự án (Random Forest) ===")
    demo_project = ProjectInput(
        team_size=5,
        planned_duration_days=60,
        total_tasks=120,
        remaining_hard_tasks=25,
        remaining_high_priority_tasks=20,
        elapsed_time_ratio=0.85,
        task_completion_ratio=0.45,
        overdue_tasks_count=15,
        avg_member_kpi=0.82,
    )

    risk_level, top_reasons, model_metrics = predict_project_delay(demo_project)
    print(f"[Dự án Demo] Mức độ rủi ro trễ hạn: {risk_level}")
    print(f"[Độ chính xác mô hình] Accuracy: {model_metrics['accuracy']*100:.2f}%")
    print(f"[Cross-Validation] CV Mean: {model_metrics['cv_accuracy_mean']*100:.2f}% ± {model_metrics['cv_accuracy_std']*100:.2f}%")
    confidence = model_metrics.get("prediction_confidence", {})
    print(f"[Độ tin cậy dự đoán] {confidence.get('confidence_percent', 0):.2f}%")
    print("Các yếu tố ảnh hưởng chính (Feature Importance):")
    for feat, imp in top_reasons:
        print(f"  - {feat}: {imp:.4f}")

    print("\nHoàn tất. Xem thêm:")
    print(f"  - Biểu đồ: {ROOT / 'output' / 'kpi_distributions.png'}")
    print(f"  - Lịch sử KPI: {ROOT / 'logs' / 'kpi_history.csv'}")


if __name__ == "__main__":
    main()
