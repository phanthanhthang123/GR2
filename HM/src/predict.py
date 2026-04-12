"""
Chọn model theo ngữ cảnh user và trả về KPI score.

- User mới / chưa có dữ liệu nội bộ → Model A (onboarding): CPA + interview + CV + num_projects + years_experience
- User đã làm việc trong hệ thống → Model B (nội bộ): projects / tasks / hard_tasks / years_at_company

Thang đầu ra:
- Model A: [0, KPI_MAX_ONBOARDING] (mặc định 0.9)
- Model B: [0, KPI_MAX_INTERNAL] (1.0)
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import joblib
import numpy as np

from src.utils import KPI_MAX_INTERNAL, KPI_MAX_ONBOARDING, model_path


@dataclass
class UserOnboardingInput:
    """Dữ liệu khi tạo account (Model A)."""

    cpa: float
    interview_score: float
    cv_score: float
    years_experience: float
    num_projects: float


@dataclass
class UserInternalInput:
    """Dữ liệu nội bộ (Model B)."""

    total_projects: int
    total_tasks: int
    hard_tasks: int
    years_at_company: float


def _load_bundle(model_key: str) -> dict[str, Any]:
    p = model_path(model_key)
    if not p.exists():
        raise FileNotFoundError(f"Chưa có model {model_key}: {p}. Hãy train trước.")
    return joblib.load(p)


def _proba_positive(pipe, X: np.ndarray) -> float:
    proba = pipe.predict_proba(X)
    return float(np.clip(proba[0, 1], 0.0, 1.0))


def scale_kpi_to_business_range(raw_proba: float, model_key: str) -> float:
    p = float(np.clip(raw_proba, 0.0, 1.0))
    if model_key == "A":
        return float(np.round(KPI_MAX_ONBOARDING * p, 6))
    if model_key == "B":
        return float(np.round(KPI_MAX_INTERNAL * p, 6))
    raise ValueError(f"model_key không hợp lệ: {model_key}")


def select_model_key(is_internal_employee: bool) -> str:
    return "B" if is_internal_employee else "A"


def predict_kpi_onboarding(user: UserOnboardingInput) -> tuple[float, str]:
    """KPI lúc tạo account — luôn Model A (vector đầy đủ onboarding)."""
    bundle = _load_bundle("A")
    pipe = bundle["pipeline"]
    vec = np.array(
        [
            [
                user.cpa,
                user.interview_score,
                user.cv_score,
                user.num_projects,
                user.years_experience,
            ]
        ],
        dtype=float,
    )
    raw = _proba_positive(pipe, vec)
    score = scale_kpi_to_business_range(raw, "A")
    return score, "A"


def predict_kpi_internal(user: UserInternalInput) -> tuple[float, str]:
    bundle = _load_bundle("B")
    pipe = bundle["pipeline"]
    vec = np.array(
        [
            [
                user.total_projects,
                user.total_tasks,
                user.hard_tasks,
                user.years_at_company,
            ]
        ],
        dtype=float,
    )
    raw = _proba_positive(pipe, vec)
    score = scale_kpi_to_business_range(raw, "B")
    return score, "B"


def predict_kpi_full(
    *,
    is_internal_employee: bool,
    onboarding: UserOnboardingInput | None = None,
    internal: UserInternalInput | None = None,
) -> tuple[float, str]:
    key = select_model_key(is_internal_employee)
    if key == "B":
        if internal is None:
            raise ValueError("Model B cần UserInternalInput (internal=...).")
        return predict_kpi_internal(internal)
    if onboarding is None:
        raise ValueError("Model A cần UserOnboardingInput (onboarding=...).")
    return predict_kpi_onboarding(onboarding)
