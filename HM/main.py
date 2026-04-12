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
from src.kpi_history import log_kpi_event
from src.plot_kpi import plot_kpi_distributions
from src.predict import UserInternalInput, UserOnboardingInput, predict_kpi_full
from src.train_model_A import train as train_a
from src.train_model_B import train as train_b
from src.utils import ensure_dirs


def main() -> None:
    ensure_dirs()
    print("=== Bước 1: Sinh dữ liệu CSV (nếu chưa có) ===")
    generate_all(force=False)

    print("\n=== Bước 2: Huấn luyện Model A, B ===")
    train_a()
    train_b()

    print("\n=== Bước 3: Bonus — biểu đồ phân phối KPI ===")
    plot_kpi_distributions()

    print("\n=== Bước 4: Ví dụ KPI khi tạo account & sau 1 quý ===")
    demo_user_id = "user_demo_001"

    cold_onb = UserOnboardingInput(
        cpa=3.2,
        interview_score=6.0,
        cv_score=6.0,
        years_experience=0.0,
        num_projects=0.0,
    )
    kpi_cold, m_cold = predict_kpi_full(
        is_internal_employee=False,
        onboarding=cold_onb,
    )
    print(f"\n[Tạo account — 0 năm, 0 project] Model {m_cold}, KPI = {kpi_cold:.4f}")

    exp_onb = UserOnboardingInput(
        cpa=3.4,
        interview_score=7.5,
        cv_score=8.0,
        years_experience=4.0,
        num_projects=12.0,
    )
    kpi_exp, m_exp = predict_kpi_full(
        is_internal_employee=False,
        onboarding=exp_onb,
    )
    print(f"[Tạo account — có KN] Model {m_exp}, KPI = {kpi_exp:.4f}")

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

    print("\nHoàn tất. Xem thêm:")
    print(f"  - Biểu đồ: {ROOT / 'output' / 'kpi_distributions.png'}")
    print(f"  - Lịch sử KPI: {ROOT / 'logs' / 'kpi_history.csv'}")


if __name__ == "__main__":
    main()
