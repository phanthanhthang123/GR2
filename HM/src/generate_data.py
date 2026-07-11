"""
Sinh dữ liệu synthetic — 2 tập:
- data_A.csv: Model A (onboarding) — cpa, interview_score, cv_score, num_projects, years_experience, KPI [0,1]
  • Trọng số thiên về năng lực (CPA, interview, CV) để sinh viên giỏi vẫn có KPI khá
  • years_experience=0 và num_projects=0 → KPI thấp hơn tương đối so với có ≥1 năm KN.
- data_B.csv: Model B (nội bộ) — total_projects, total_tasks, hard_tasks, years_at_company, KPI [0,1]
"""
from __future__ import annotations

import json
import datetime
import numpy as np
import pandas as pd

from src.utils import DATA_DIR, ensure_dirs


RNG = np.random.default_rng(20260412)

N_SAMPLES = 5000
N_ANCHOR = 500

# Internal (ex-C)
INT_CAP = 0.40
TASK_MIN, TASK_MAX = 12, 320
PROJ_MIN, PROJ_MAX = 1, 13

B_PROJ_LOG_LO = np.log1p(1)
B_PROJ_LOG_HI = np.log1p(70)


def _clip01(x: np.ndarray) -> np.ndarray:
    return np.clip(x, 0.0, 1.0)


def _num_projects_for_years(years: float) -> int:
    y = float(max(1.0, years))
    hard_cap = min(70, max(2, int(np.floor(4.0 * y))))
    lo = max(1, int(0.32 * y))
    lo = min(lo, hard_cap - 1)
    center = min(hard_cap - 0.51, 0.55 * y + 1.0 + RNG.normal(0, 0.45))
    hi = int(np.clip(round(center), lo + 1, hard_cap))
    return int(RNG.integers(lo, hi + 1))


def _b_proj_norm(num_projects: np.ndarray) -> np.ndarray:
    x = np.log1p(np.asarray(num_projects, dtype=float))
    return _clip01((x - B_PROJ_LOG_LO) / (B_PROJ_LOG_HI - B_PROJ_LOG_LO))


# --- Onboarding merged (data_A) ---
def _generate_onboarding_bulk(n: int) -> pd.DataFrame:
    ability = RNG.beta(2.3, 2.3, n)
    cpa_raw = 2.1 + ability * 1.75 + RNG.normal(0, 0.22, n)
    cpa = np.clip(np.round(cpa_raw, 2), 2.0, 4.0)
    interview = np.clip(ability * 6.8 + 1.85 + RNG.normal(0, 1.1, n), 0.0, 10.0)
    interview = np.round(interview, 2)
    cv_score = (
        0.62 * (ability * 6.5 + 2.2)
        + 0.2 * (interview - 5.0) * 0.35
        + RNG.normal(0, 0.85, n)
    )
    cv_score = np.clip(cv_score, 0.0, 10.0)
    cv_score = np.round(cv_score, 2)

    years_experience = np.round(RNG.uniform(0.0, 22.0, n), 2)
    num_projects = np.zeros(n, dtype=np.int32)
    for i in range(n):
        y = float(years_experience[i])
        if y < 1.0:
            num_projects[i] = int(RNG.integers(0, 6))
        else:
            num_projects[i] = _num_projects_for_years(y)

    cpa_n = (cpa - 2.0) / 2.0
    int_n = interview / 10.0
    cv_n = cv_score / 10.0
    proj_n = _b_proj_norm(num_projects.astype(float))
    senior = np.clip(years_experience / 22.0, 0.0, 1.0)

    # Trọng số thiên về năng lực học vấn (CPA, interview, CV = 75%)
    # để sinh viên giỏi nhưng chưa có KN vẫn có KPI hợp lý (~0.35-0.45)
    kpi_core = (
        0.28 * cpa_n
        + 0.25 * int_n
        + 0.22 * cv_n
        + 0.15 * proj_n
        + 0.10 * senior
    )
    cold = (years_experience < 1.0) & (num_projects == 0)
    kpi_core = np.where(cold, kpi_core - 0.08, kpi_core)
    kpi = np.round(_clip01(kpi_core + RNG.normal(0, 0.05, n)), 4)

    return pd.DataFrame(
        {
            "cpa": cpa,
            "interview_score": interview,
            "CV_score": cv_score,
            "num_projects": num_projects,
            "years_experience": years_experience,
            "KPI": kpi,
        }
    )


def _generate_onboarding_anchors(count: int) -> pd.DataFrame:
    targets = np.linspace(0.0, 1.0, count)
    rows = []
    for t in targets:
        t = float(t)
        cpa = float(np.clip(2.0 + 2.0 * t, 2.0, 4.0))
        iv = 10.0 * t
        cv = 10.0 * t
        if t < 0.35:
            years = 0.0
            npj = 0
        else:
            years = float(np.clip(1.0 + 20.0 * t, 1.0, 22.0))
            npj = max(1, _num_projects_for_years(years))
        cpa_n = (cpa - 2.0) / 2.0
        proj_n = float(_b_proj_norm(np.array([npj]))[0])
        senior = np.clip(years / 22.0, 0.0, 1.0)
        kpi_core = 0.28 * cpa_n + 0.25 * (iv / 10) + 0.22 * (cv / 10) + 0.15 * proj_n + 0.10 * senior
        if years < 1.0 and npj == 0:
            kpi_core -= 0.08
        kpi = float(np.round(_clip01(kpi_core), 4))
        rows.append(
            {
                "cpa": round(cpa, 2),
                "interview_score": round(iv, 2),
                "CV_score": round(cv, 2),
                "num_projects": int(npj),
                "years_experience": round(years, 2),
                "KPI": kpi,
            }
        )
    return pd.DataFrame(rows)


def generate_dataset_onboarding(n: int = N_SAMPLES) -> pd.DataFrame:
    na = min(N_ANCHOR, n)
    nb = n - na
    parts = []
    if nb > 0:
        parts.append(_generate_onboarding_bulk(nb))
    if na > 0:
        parts.append(_generate_onboarding_anchors(na))
    df = pd.concat(parts, ignore_index=True)
    df = df.iloc[RNG.permutation(len(df))].reset_index(drop=True)
    assert df["cpa"].between(2.0, 4.0).all()
    assert df["interview_score"].between(0, 10).all()
    assert df["CV_score"].between(0, 10).all()
    assert df["num_projects"].ge(0).all()
    assert df["years_experience"].between(0, 22).all()
    assert df["KPI"].between(0, 1).all()
    return df


# --- Internal (data_B) ---
def _proj_norm(tp):
    tp = np.asarray(tp, dtype=float)
    return _clip01((tp - PROJ_MIN) / (PROJ_MAX - PROJ_MIN))


def _vol_norm(tt):
    tt = np.asarray(tt, dtype=float)
    lo, hi = np.log1p(TASK_MIN), np.log1p(TASK_MAX)
    return _clip01((np.log1p(tt) - lo) / (hi - lo))


def _intensity_norm(ht, tt):
    raw = np.where(tt > 0, ht / tt, 0.0)
    return _clip01(raw / INT_CAP)


def _internal_kpi_core(tp, tt, ht, yac):
    p = _proj_norm(tp)
    v = _vol_norm(tt)
    i = _intensity_norm(ht, tt)
    yn = _clip01(np.asarray(yac, dtype=float) / 10.0)
    return 0.24 * p + 0.38 * v + 0.22 * i + 0.16 * yn


def _generate_internal_bulk(n: int) -> pd.DataFrame:
    total_projects = RNG.integers(PROJ_MIN, PROJ_MAX + 1, n)
    t_per_p = RNG.integers(6, 29, n)
    jitter = RNG.integers(-8, 18, n)
    total_tasks = np.clip(total_projects * t_per_p + jitter, TASK_MIN, TASK_MAX)
    hard_frac = np.clip(RNG.beta(2.2, 7.0, n), 0.05, 0.40)
    hard_tasks = np.floor(total_tasks.astype(float) * hard_frac).astype(int)
    hard_tasks = np.minimum(np.maximum(hard_tasks, 0), total_tasks)
    need_one = (total_tasks >= 40) & (hard_tasks == 0)
    hard_tasks = np.where(need_one, 1, hard_tasks)
    hard_tasks = np.minimum(hard_tasks, total_tasks)
    years_at_company = np.round(RNG.uniform(0.0, 10.0, n), 2)

    kpi_core = _internal_kpi_core(total_projects, total_tasks, hard_tasks, years_at_company)
    kpi = np.round(_clip01(kpi_core + RNG.normal(0, 0.04, n)), 4)

    return pd.DataFrame(
        {
            "total_projects": total_projects.astype(int),
            "total_tasks": total_tasks.astype(int),
            "hard_tasks": hard_tasks.astype(int),
            "years_at_company": years_at_company,
            "KPI": kpi,
        }
    )


def _internal_anchor_row(t: float) -> dict:
    t = float(np.clip(t, 0.0, 1.0))
    tp = int(np.clip(round(PROJ_MIN + t * (PROJ_MAX - PROJ_MIN)), PROJ_MIN, PROJ_MAX))
    lo, hi = np.log1p(TASK_MIN), np.log1p(TASK_MAX)
    tt = int(np.clip(round(np.expm1(t * (hi - lo) + lo)), TASK_MIN, TASK_MAX))
    hard = int(np.clip(round(t * INT_CAP * tt), 0, tt))
    yac = round(10.0 * t, 2)
    kc = float(_internal_kpi_core(np.array([tp]), np.array([tt]), np.array([hard]), np.array([yac]))[0])
    return {
        "total_projects": tp,
        "total_tasks": tt,
        "hard_tasks": hard,
        "years_at_company": yac,
        "KPI": float(np.round(_clip01(kc), 4)),
    }


def _generate_internal_anchors(count: int) -> pd.DataFrame:
    targets = np.linspace(0.0, 1.0, count)
    return pd.DataFrame([_internal_anchor_row(float(t)) for t in targets])


def parse_date(date_str):
    if not date_str:
        return None
    try:
        clean_str = date_str.split('.')[0].split('+')[0]
        if 'T' in clean_str:
            return datetime.datetime.strptime(clean_str, "%Y-%m-%dT%H:%M:%S")
        else:
            return datetime.datetime.strptime(clean_str, "%Y-%m-%d")
    except Exception:
        return None


def generate_dataset_internal(n: int = N_SAMPLES) -> pd.DataFrame:
    print("[generate_data] Extracting real user performance profiles from raw_jira...")
    files = list(DATA_DIR.glob("raw_jira/*_issues.json"))
    
    user_projects = {}
    user_tasks_count = {}
    user_hard_tasks_count = {}
    user_resolved_count = {}
    user_dates = {}
    user_names = {}
    
    for file_path in files:
        if file_path.stat().st_size < 100:
            continue
        proj_key = file_path.stem.split("_")[0]
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            issues = data.get("issues", [])
            for issue in issues:
                fields = issue.get("fields", {})
                assignee = fields.get("assignee")
                if not assignee:
                    continue
                uid = assignee.get("accountId")
                if not uid:
                    continue
                
                # Save name
                user_names[uid] = assignee.get("displayName", "Unknown")
                
                # Update projects set
                if uid not in user_projects:
                    user_projects[uid] = set()
                user_projects[uid].add(proj_key)
                
                # Update total tasks
                user_tasks_count[uid] = user_tasks_count.get(uid, 0) + 1
                
                # Update hard tasks
                priority = fields.get("priority", {}).get("name", "Medium")
                issuetype = fields.get("issuetype", {}).get("name", "Task")
                is_hard = (issuetype == "Bug") or (priority in ["Critical", "Blocker", "High", "Major"])
                if is_hard:
                    user_hard_tasks_count[uid] = user_hard_tasks_count.get(uid, 0) + 1
                
                # Update resolved
                resolved_date = fields.get("resolutiondate")
                if resolved_date:
                    user_resolved_count[uid] = user_resolved_count.get(uid, 0) + 1
                
                # Update dates
                created_str = fields.get("created")
                if created_str:
                    created_date = parse_date(created_str)
                    if created_date:
                        if uid not in user_dates:
                            user_dates[uid] = []
                        user_dates[uid].append(created_date)
        except Exception:
            pass
            
    # Calculate features for each user
    real_users_with_meta = []
    real_users_for_training = []
    
    for uid in user_tasks_count:
        tot_tasks = user_tasks_count[uid]
        if tot_tasks < 3:  # filter passive users
            continue
            
        tot_projs = len(user_projects.get(uid, set()))
        hard_tasks = user_hard_tasks_count.get(uid, 0)
        resolved = user_resolved_count.get(uid, 0)
        
        # Calculate years_at_company (tenure in company based on tasks duration)
        dates = user_dates.get(uid, [])
        if len(dates) >= 2:
            tenure_days = (max(dates) - min(dates)).days
            yac = max(0.1, round(tenure_days / 365.25, 2))
        else:
            yac = 0.1
        yac = min(10.0, max(0.1, yac))
        
        # Calculate non-linear KPI:
        completion_rate = resolved / tot_tasks
        bug_ratio = hard_tasks / tot_tasks if tot_tasks > 0 else 0.0
        
        # Base KPI is calculated realistically using non-linear constraints
        kpi_score = 0.5 + 0.4 * completion_rate - 0.25 * bug_ratio
        
        # Apply penalties / bonuses
        if bug_ratio > 0.4:
            kpi_score -= 0.15 # High bug rate penalty
        if tot_tasks > 30:
            kpi_score += 0.08 # High volume bonus
        if yac > 3.0:
            kpi_score += 0.05 # Tenure bonus
            
        kpi_score = float(np.clip(kpi_score, 0.0, 1.0))
        
        # Add metadata version
        real_users_with_meta.append({
            "user_id": uid,
            "display_name": user_names.get(uid, "Unknown"),
            "total_projects": int(tot_projs),
            "total_tasks": int(tot_tasks),
            "hard_tasks": int(hard_tasks),
            "years_at_company": float(yac),
            "KPI": float(np.round(kpi_score, 4))
        })
        
        # Training dataset (no IDs/names to match features structure)
        real_users_for_training.append({
            "total_projects": int(tot_projs),
            "total_tasks": int(tot_tasks),
            "hard_tasks": int(hard_tasks),
            "years_at_company": float(yac),
            "KPI": float(np.round(kpi_score, 4))
        })
        
    df_meta = pd.DataFrame(real_users_with_meta)
    real_csv_path = DATA_DIR / "users_kpi_real.csv"
    df_meta.to_csv(real_csv_path, index=False)
    print(f"[generate_data] Saved real user dataset ({len(df_meta)} users) with ID/Name meta to {real_csv_path}")
    
    df_real = pd.DataFrame(real_users_for_training)
    print(f"[generate_data] Extracted {len(df_real)} active real users from raw_jira.")
    
    # 2. Augment/bootstrap the dataset to n samples
    if len(df_real) < n:
        needed = n - len(df_real)
        df_resampled = df_real.sample(n=needed, replace=True, random_state=42).copy()
        
        # Add small realistic noise to avoid duplicate rows
        rng = np.random.default_rng(42)
        df_resampled["total_tasks"] = np.clip(df_resampled["total_tasks"] + rng.integers(-2, 3, size=needed), 3, TASK_MAX).astype(int)
        df_resampled["total_projects"] = np.clip(df_resampled["total_projects"] + rng.integers(-1, 2, size=needed), PROJ_MIN, PROJ_MAX).astype(int)
        df_resampled["hard_tasks"] = np.clip(df_resampled["hard_tasks"] + rng.integers(-1, 2, size=needed), 0, df_resampled["total_tasks"]).astype(int)
        df_resampled["years_at_company"] = np.clip(np.round(df_resampled["years_at_company"] + rng.normal(0, 0.15, size=needed), 2), 0.1, 10.0)
        
        # Recalculate KPIs with noise
        for idx in range(needed):
            row = df_resampled.iloc[idx]
            new_kpi = np.clip(row["KPI"] + rng.normal(0, 0.04), 0.0, 1.0)
            df_resampled.iloc[idx, df_resampled.columns.get_loc("KPI")] = float(np.round(new_kpi, 4))
            
        df_final = pd.concat([df_real, df_resampled], ignore_index=True)
    else:
        df_final = df_real
        
    df_final = df_final.iloc[np.random.default_rng(20260412).permutation(len(df_final))].reset_index(drop=True)
    
    assert (df_final["hard_tasks"] <= df_final["total_tasks"]).all()
    assert df_final["total_tasks"].ge(3).all()
    assert df_final["total_projects"].ge(PROJ_MIN).all()
    assert df_final["years_at_company"].between(0, 10).all()
    assert df_final["KPI"].between(0, 1).all()
    return df_final



def _coverage_report(name: str, df: pd.DataFrame) -> None:
    kpi = df["KPI"].values
    hist, _ = np.histogram(kpi, bins=np.linspace(0.0, 1.0, 11))
    empty = int((hist == 0).sum())
    print(f"    [{name}] KPI deciles empty bins: {empty}/10 | min={kpi.min():.4f} max={kpi.max():.4f}")


def generate_all(n: int = N_SAMPLES, force: bool = False) -> None:
    ensure_dirs()
    mapping = [
        ("A", DATA_DIR / "data_A.csv", generate_dataset_onboarding),
        ("B", DATA_DIR / "data_B.csv", generate_dataset_internal),
    ]
    for key, path, gen in mapping:
        if path.exists() and not force:
            print(f"[generate_data] Giữ nguyên (đã tồn tại): {path}")
            continue
        df = gen(n)
        df.to_csv(path, index=False)
        print(f"[generate_data] Đã ghi {len(df)} dòng → {path}")
        _coverage_report(key, df)
        if key == "A":
            cold = df[(df["years_experience"] < 1) & (df["num_projects"] == 0)]["KPI"].mean()
            exp = df[df["years_experience"] >= 1]["KPI"].mean()
            print(f"    [A] KPI mean (cold 0y0p)={cold:.3f} vs (y>=1)={exp:.3f}")
        else:
            frac = (df["hard_tasks"] / df["total_tasks"]).mean()
            print(f"    [B] tasks mean={df['total_tasks'].mean():.0f}, hard%={frac*100:.1f}%, yac mean={df['years_at_company'].mean():.2f}")


if __name__ == "__main__":
    generate_all(force=True)
