"""
Đường dẫn gốc project và tiện ích dùng chung.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Console Windows (cp1252): tránh UnicodeEncodeError khi print tiếng Việt
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Thang KPI sau dự đoán (map từ xác suất LR)
# Model A (onboarding gộp: CPA + interview + CV + num_projects + years_experience)
KPI_MAX_ONBOARDING = 0.9
# Model B (nội bộ: projects/tasks/hard + years_at_company)
KPI_MAX_INTERNAL = 1.0

# Ngưỡng nhị phân khi train (KPI trong CSV thang [0, 1])
KPI_TRAIN_THRESHOLD = 0.5

# Thư mục gốc HM (cha của src/)
ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models"
LOGS_DIR = ROOT_DIR / "logs"
OUTPUT_DIR = ROOT_DIR / "output"


def ensure_dirs() -> None:
    """Tạo thư mục cần thiết nếu chưa tồn tại."""
    for d in (DATA_DIR, MODELS_DIR, LOGS_DIR, OUTPUT_DIR):
        d.mkdir(parents=True, exist_ok=True)


def model_path(name: str) -> Path:
    """Trả về đường dẫn file .pkl cho model A hoặc B."""
    return MODELS_DIR / f"model_{name}.pkl"
