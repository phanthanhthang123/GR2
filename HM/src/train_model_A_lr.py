"""
Huấn luyện Model A (onboarding gộp): cpa, interview_score, CV_score, num_projects, years_experience.
"""
from pathlib import Path

from src.train_common import train_multi_threshold_lr
from src.utils import DATA_DIR, ensure_dirs

FEATURES_A = [
    "cpa",
    "interview_score",
    "CV_score",
    "num_projects",
    "years_experience",
]


def train(data_path: Path | None = None) -> None:
    ensure_dirs()
    path = data_path or (DATA_DIR / "data_A.csv")
    if not path.exists():
        raise FileNotFoundError(f"Thiếu file dữ liệu: {path}. Chạy generate_data trước.")
    train_multi_threshold_lr(path, FEATURES_A, "A")


if __name__ == "__main__":
    train()
