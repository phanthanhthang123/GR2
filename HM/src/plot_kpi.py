"""
Bonus: vẽ phân phối KPI từ các file CSV trong data/.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from src.utils import DATA_DIR, OUTPUT_DIR, ensure_dirs


def plot_kpi_distributions(output_name: str = "kpi_distributions.png") -> Path:
    ensure_dirs()
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))
    labels = ["A (Onboarding)", "B (Internal)"]
    files = ["data_A.csv", "data_B.csv"]
    for ax, fname, title in zip(axes, files, labels):
        path = DATA_DIR / fname
        if not path.exists():
            ax.set_title(f"{title}\n(thiếu {fname})")
            continue
        df = pd.read_csv(path)
        ax.hist(df["KPI"], bins=30, color="steelblue", edgecolor="white", alpha=0.85)
        ax.set_title(title)
        ax.set_xlabel("KPI")
        ax.set_ylabel("Count")
    fig.suptitle(
        "KPI trong CSV (5000 dòng/model). Train thang [0,1]; A đầu ra tối đa 0.9, B tối đa 1.0",
        fontsize=10,
    )
    fig.tight_layout()
    out = OUTPUT_DIR / output_name
    fig.savefig(out, dpi=120, bbox_inches="tight")
    plt.close(fig)
    print(f"[plot_kpi] Đã lưu biểu đồ → {out}")
    return out
