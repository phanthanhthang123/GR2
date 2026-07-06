import sys
import time
import json
import numpy as np
from pathlib import Path
from dataclasses import asdict

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.predict import (
    UserOnboardingInput,
    UserInternalInput,
    ProjectInput,
    predict_kpi_onboarding,
    predict_kpi_internal,
    predict_project_delay,
)

def benchmark_python_internal(iterations=100):
    print(f"--- Benchmarking Python Internal Functions ({iterations} runs) ---")
    
    # Inputs
    u_onboard = UserOnboardingInput(
        cpa=3.5,
        interview_score=8.5,
        cv_score=9.0,
        years_experience=2.0,
        num_projects=3.0,
    )
    u_internal = UserInternalInput(
        total_projects=5,
        total_tasks=120,
        hard_tasks=25,
        years_at_company=2.5,
    )
    p_input = ProjectInput(
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
    
    # Model A
    times_a = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        predict_kpi_onboarding(u_onboard)
        times_a.append((time.perf_counter() - t0) * 1000) # ms
        
    # Model B
    times_b = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        predict_kpi_internal(u_internal)
        times_b.append((time.perf_counter() - t0) * 1000) # ms
        
    # RF Model
    times_rf = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        predict_project_delay(p_input)
        times_rf.append((time.perf_counter() - t0) * 1000) # ms
        
    print(f"Model A (Onboarding LR) - Mean: {np.mean(times_a):.4f} ms, Std: {np.std(times_a):.4f} ms")
    print(f"Model B (Internal LR)   - Mean: {np.mean(times_b):.4f} ms, Std: {np.std(times_b):.4f} ms")
    print(f"Model RF (Project Delay)- Mean: {np.mean(times_rf):.4f} ms, Std: {np.std(times_rf):.4f} ms")
    return {
        "A": {"mean": np.mean(times_a), "std": np.std(times_a)},
        "B": {"mean": np.mean(times_b), "std": np.std(times_b)},
        "RF": {"mean": np.mean(times_rf), "std": np.std(times_rf)},
    }

def benchmark_end_to_end_ipc(iterations=20):
    import subprocess
    print(f"\n--- Benchmarking End-to-End IPC from Node/Shell ({iterations} runs) ---")
    
    python_exe = sys.executable
    onboard_cli = str(ROOT / "src" / "predict_onboarding_cli.py")
    internal_cli = str(ROOT / "src" / "predict_internal_cli.py")
    project_cli = str(ROOT / "src" / "predict_project_cli.py")
    
    payload_a = json.dumps({
        "cpa": 3.5,
        "interview_score": 8.5,
        "cv_score": 9.0,
        "years_experience": 2.0,
        "num_projects": 3.0,
    })
    payload_b = json.dumps({
        "total_projects": 5,
        "total_tasks": 120,
        "hard_tasks": 25,
        "years_at_company": 2.5,
    })
    payload_rf = json.dumps({
        "team_size": 5,
        "planned_duration_days": 60,
        "total_tasks": 120,
        "remaining_hard_tasks": 25,
        "remaining_high_priority_tasks": 20,
        "elapsed_time_ratio": 0.85,
        "task_completion_ratio": 0.45,
        "overdue_tasks_count": 15,
        "avg_member_kpi": 0.82,
    })
    
    # Model A CLI
    times_a_cli = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        p = subprocess.Popen(
            [python_exe, onboard_cli],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT),
        )
        out, err = p.communicate(input=payload_a)
        times_a_cli.append((time.perf_counter() - t0) * 1000) # ms
        
    # Model B CLI
    times_b_cli = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        p = subprocess.Popen(
            [python_exe, internal_cli],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT),
        )
        out, err = p.communicate(input=payload_b)
        times_b_cli.append((time.perf_counter() - t0) * 1000) # ms
        
    # RF CLI
    times_rf_cli = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        p = subprocess.Popen(
            [python_exe, project_cli],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT),
        )
        out, err = p.communicate(input=payload_rf)
        times_rf_cli.append((time.perf_counter() - t0) * 1000) # ms
        
    print(f"Model A CLI (IPC) - Mean: {np.mean(times_a_cli):.4f} ms, Std: {np.std(times_a_cli):.4f} ms")
    print(f"Model B CLI (IPC) - Mean: {np.mean(times_b_cli):.4f} ms, Std: {np.std(times_b_cli):.4f} ms")
    print(f"Model RF CLI (IPC)- Mean: {np.mean(times_rf_cli):.4f} ms, Std: {np.std(times_rf_cli):.4f} ms")
    return {
        "A": {"mean": np.mean(times_a_cli), "std": np.std(times_a_cli)},
        "B": {"mean": np.mean(times_b_cli), "std": np.std(times_b_cli)},
        "RF": {"mean": np.mean(times_rf_cli), "std": np.std(times_rf_cli)},
    }

if __name__ == "__main__":
    benchmark_python_internal(100)
    benchmark_end_to_end_ipc(50)
