"""
Ghi log lịch sử KPI (bonus): append CSV theo thời gian.
"""
from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path

from src.utils import LOGS_DIR, ensure_dirs

HISTORY_FILE = LOGS_DIR / "kpi_history.csv"


def log_kpi_event(
    user_id: str,
    kpi: float,
    model_used: str,
    event: str,
    *,
    path: Path | None = None,
) -> None:
    """
    event: ví dụ 'account_created', 'quarterly_update'
    """
    ensure_dirs()
    target = path or HISTORY_FILE
    write_header = not target.exists()
    row = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "kpi": round(float(kpi), 6),
        "model_used": model_used,
        "event": event,
    }
    with target.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(row.keys()))
        if write_header:
            w.writeheader()
        w.writerow(row)
    print(f"[kpi_history] Ghi log → {target}")
