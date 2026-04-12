"""
CLI cho Node.js: đọc JSON stdin → stdout JSON { kpi, model, err, msg }.
Chạy với cwd = thư mục HM (để load models/).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HM_ROOT = Path(__file__).resolve().parents[1]
if str(HM_ROOT) not in sys.path:
    sys.path.insert(0, str(HM_ROOT))

from src.predict import UserOnboardingInput, predict_kpi_onboarding  # noqa: E402


def main() -> None:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            print(json.dumps({"err": 1, "msg": "empty stdin"}))
            sys.exit(1)
        data = json.loads(raw)
        cpa = data.get("cpa", data.get("gpa"))
        if cpa is None:
            cpa = 3.0
        u = UserOnboardingInput(
            cpa=float(cpa),
            interview_score=float(data.get("interview_score", 6.0)),
            cv_score=float(data.get("cv_score", 6.0)),
            years_experience=float(data.get("years_experience", 0)),
            num_projects=float(data.get("num_projects", 0)),
        )
        kpi, model_key = predict_kpi_onboarding(u)
        out = {
            "err": 0,
            "kpi": kpi,
            "model": model_key,
            "msg": "",
        }
        print(json.dumps(out), flush=True)
    except Exception as e:
        print(json.dumps({"err": 1, "msg": str(e), "kpi": None, "model": None}), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
