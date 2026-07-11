import urllib.request
import json
import datetime
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
import joblib
from pathlib import Path

# Paths Setup
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw_jira"
MODELS_DIR = ROOT_DIR / "models"

RAW_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        clean_str = date_str.split('.')[0]
        if 'T' in clean_str:
            return datetime.datetime.strptime(clean_str, "%Y-%m-%dT%H:%M:%S")
        else:
            return datetime.datetime.strptime(clean_str, "%Y-%m-%d")
    except Exception:
        return None

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode())

def download_raw_data(max_projects=150, force_redownload=False):
    print("=" * 60)
    print("STEP 1: DOWNLOADING RAW JIRA DATA FROM RED HAT")
    print("=" * 60)
    
    existing_files = list(RAW_DIR.glob("*_issues.json"))
    # Skip if we already have files and force_redownload is False
    if len(existing_files) >= 50 and not force_redownload:
        print(f"Found {len(existing_files)} raw project files already in {RAW_DIR}. Skipping download.")
        return True
        
    projects_url = "https://issues.redhat.com/rest/api/2/project"
    try:
        projects = fetch_json(projects_url)
    except Exception as e:
        print(f"Error fetching projects list: {e}")
        return False

    # Save raw projects list
    with open(RAW_DIR / "projects_list.json", "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
    print(f"Saved raw projects list ({len(projects)} projects) to {RAW_DIR / 'projects_list.json'}")

    valid_count = 0
    # We attempt to crawl up to max_projects to collect as much data as possible
    for idx, proj in enumerate(projects):
        if valid_count >= max_projects:
            break
            
        key = proj.get("key")
        name = proj.get("name")
        print(f"[{idx+1}/{len(projects)}] Fetching issues for {key} ({name})...")
        
        # Add expand=changelog to fetch all logs activity of each task
        url = f"https://issues.redhat.com/rest/api/2/search/jql?jql=project={key}&maxResults=150&expand=changelog&fields=summary,status,priority,updated,created,assignee,duedate,issuetype,resolutiondate"
        try:
            raw_data = fetch_json(url)
            issues = raw_data.get("issues", [])
            
            # Save raw project issues JSON
            raw_file_path = RAW_DIR / f"{key}_issues.json"
            with open(raw_file_path, "w", encoding="utf-8") as f:
                json.dump(raw_data, f, ensure_ascii=False, indent=2)
                
            if len(issues) >= 5:
                valid_count += 1
                print(f"  -> Saved raw JSON ({len(issues)} tasks) with changelog to {raw_file_path.name}. Total valid: {valid_count}")
            else:
                print(f"  -> Saved raw JSON ({len(issues)} tasks) but marked as sparse/empty.")
        except Exception as e:
            print(f"  -> Error fetching issues for {key}: {e}")
            
    print(f"\nCompleted raw download. Saved raw files to directory: {RAW_DIR}")
    return True

def normalize_crawled_data():
    print("\n" + "=" * 60)
    print("STEP 2: NORMALIZING RAW DATA & CREATING FEATURE DATASET")
    print("=" * 60)
    
    project_records = []
    
    # Read each saved raw JSON file
    for file_path in RAW_DIR.glob("*_issues.json"):
        key = file_path.stem.split("_")[0]
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            issues = data.get("issues", [])
            if len(issues) < 5:
                continue
                
            parsed_issues = []
            for issue in issues:
                fields = issue.get("fields", {})
                created = parse_date(fields.get("created"))
                updated = parse_date(fields.get("updated"))
                resolved = parse_date(fields.get("resolutiondate"))
                duedate = parse_date(fields.get("duedate"))
                
                assignee = fields.get("assignee")
                assignee_id = assignee.get("accountId") if assignee else None
                
                priority = fields.get("priority", {}).get("name", "Medium")
                status = fields.get("status", {}).get("name", "Open")
                issuetype = fields.get("issuetype", {}).get("name", "Task")
                
                parsed_issues.append({
                    'created': created,
                    'updated': updated,
                    'resolved': resolved,
                    'duedate': duedate,
                    'assignee_id': assignee_id,
                    'priority': priority,
                    'status': status,
                    'issuetype': issuetype
                })
                
            # Filter projects with invalid created dates
            created_dates = [x['created'] for x in parsed_issues if x['created']]
            updated_dates = [x['updated'] for x in parsed_issues if x['updated']]
            resolved_dates = [x['resolved'] for x in parsed_issues if x['resolved']]
            
            if not created_dates:
                continue
                
            min_created = min(created_dates)
            max_updated = max(updated_dates) if updated_dates else min_created
            
            # Planned due date
            due_dates = [x['duedate'] for x in parsed_issues if x['duedate']]
            planned_due = max(due_dates) if due_dates else max_updated + datetime.timedelta(days=30)
            planned_duration_days = max(1, (planned_due - min_created).days)
            
            # Snapshot date (70% of planned duration timeline snapshot to prevent data leakage)
            snapshot_date = min_created + datetime.timedelta(days=int(planned_duration_days * 0.7))
            
            # Calculate features at snapshot
            snapshot_issues = [x for x in parsed_issues if x['created'] and x['created'] <= snapshot_date]
            if not snapshot_issues:
                continue
                
            total_tasks = len(snapshot_issues)
            assignees = {x['assignee_id'] for x in snapshot_issues if x['assignee_id']}
            team_size = max(1, len(assignees))
            
            # Completed tasks at snapshot
            completed_tasks = sum(1 for x in snapshot_issues if x['resolved'] and x['resolved'] <= snapshot_date)
            task_completion_ratio = completed_tasks / total_tasks if total_tasks > 0 else 0.0
            
            # Remaining issues at snapshot
            remaining_issues = [x for x in snapshot_issues if not (x['resolved'] and x['resolved'] <= snapshot_date)]
            
            # High priority & Hard tasks
            high_priority_names = {'Critical', 'Blocker', 'High', 'Major'}
            remaining_high_priority_tasks = sum(1 for x in remaining_issues if x['priority'] in high_priority_names)
            remaining_hard_tasks = sum(1 for x in remaining_issues if x['issuetype'] == 'Bug' or x['priority'] in {'Critical', 'Blocker'})
            
            # Overdue tasks
            overdue_tasks_count = sum(1 for x in remaining_issues if x['duedate'] and x['duedate'] < snapshot_date)
            
            # Elapsed time ratio
            elapsed_time_ratio = (snapshot_date - min_created).days / planned_duration_days
            elapsed_time_ratio = min(1.0, max(0.0, elapsed_time_ratio))
            
            # Avg member KPI
            member_resolved = {}
            member_total = {}
            for x in snapshot_issues:
                uid = x['assignee_id']
                if uid:
                    member_total[uid] = member_total.get(uid, 0) + 1
                    if x['resolved'] and x['resolved'] <= snapshot_date:
                        member_resolved[uid] = member_resolved.get(uid, 0) + 1
            kpis = [member_resolved.get(uid, 0) / member_total.get(uid, 0) for uid in assignees if member_total.get(uid, 0) > 0]
            avg_member_kpi = np.mean(kpis) if kpis else 0.5
            
            # Target delay risk label based on final project outcome
            actual_end = max(resolved_dates) if resolved_dates else max_updated
            delay_days = (actual_end - planned_due).days
            
            if delay_days > 15:
                delay_risk_level = 'High'
            elif delay_days > 0:
                delay_risk_level = 'Medium'
            else:
                delay_risk_level = 'Low'
                
            project_records.append({
                'project_key': key,
                'team_size': team_size,
                'planned_duration_days': planned_duration_days,
                'total_tasks': total_tasks,
                'remaining_hard_tasks': remaining_hard_tasks,
                'remaining_high_priority_tasks': remaining_high_priority_tasks,
                'elapsed_time_ratio': elapsed_time_ratio,
                'task_completion_ratio': task_completion_ratio,
                'overdue_tasks_count': overdue_tasks_count,
                'avg_member_kpi': avg_member_kpi,
                'delay_risk_level': delay_risk_level
            })
        except Exception as e:
            print(f"Error processing raw file {file_path.name}: {e}")
            
    df = pd.DataFrame(project_records)
    
    # Save normalized CSV dataset
    normalized_path = DATA_DIR / "projects_normalized.csv"
    df.to_csv(normalized_path, index=False)
    print(f"Successfully processed {len(df)} project records.")
    print(f"Saved clean, normalized dataset to: {normalized_path}")
    return df

def train_and_eval_risk_matrix(df):
    print("\n" + "=" * 60)
    print("STEP 3: TRAINING MACHINE LEARNING MODEL & RISK MATRIX DIAGNOSIS")
    print("=" * 60)

    # Clean and bootstrap to ensure sufficient dataset distribution
    if len(df) < 10:
        print("Real dataset size is small. Merging with mock projects to ensure robust training data...")
        mock_path = DATA_DIR / "projects_mock.csv"
        if mock_path.exists():
            df_mock = pd.read_csv(mock_path)
            df_mock = df_mock[df.columns.intersection(df_mock.columns)]
            df = pd.concat([df, df_mock], ignore_index=True)
            
    feature_cols = [
        "team_size",
        "planned_duration_days",
        "total_tasks",
        "remaining_hard_tasks",
        "remaining_high_priority_tasks",
        "elapsed_time_ratio",
        "task_completion_ratio",
        "overdue_tasks_count",
        "avg_member_kpi"
    ]
    
    # Features & Targets
    X = df[feature_cols]
    y = df["delay_risk_level"]
    
    # Handle single class case if any
    unique_classes = sorted(y.unique())
    
    # Train Random Forest Classifier on the ENTIRE dataset using optimal tuned hyperparameters
    rf = RandomForestClassifier(
        n_estimators=60,
        max_depth=4,
        min_samples_leaf=3,
        min_samples_split=6,
        random_state=42,
        class_weight='balanced'
    )
    rf.fit(X, y)
    
    # Predictions on entire dataset
    y_pred = rf.predict(X)
    
    # Generate Confusion Matrix / Risk Matrix
    cm = confusion_matrix(y, y_pred, labels=unique_classes)
    
    # Print Confusion Matrix (Risk Diagnosis Matrix) without Vietnamese diacritics
    print("\nMA TRAN RUI RO (CONFUSION MATRIX / RISK DIAGNOSIS MATRIX ON ALL DATA):")
    print("-" * 50)
    # Format a nice text table for Confusion Matrix
    print(f"{'Actual / Predict':<18} | " + " | ".join(f"{c:<8}" for c in unique_classes))
    print("-" * 50)
    for idx, actual_cls in enumerate(unique_classes):
        row_vals = cm[idx]
        print(f"{actual_cls:<18} | " + " | ".join(f"{val:<8}" for val in row_vals))
    print("-" * 50)
    
    print("\nBAO CAO DANH GIA MO HINH HOC MAY (CLASSIFICATION REPORT ON ALL DATA):")
    print(classification_report(y, y_pred, labels=unique_classes, zero_division=0))
    
    # Model serialization (Save to a separate file to preserve the user's original mock-trained model)
    out_path = MODELS_DIR / "rf_project_delay_real.pkl"
    bundle = {
        "model": rf,
        "feature_columns": feature_cols,
        "feature_importances": sorted(zip(feature_cols, rf.feature_importances_), key=lambda x: x[1], reverse=True),
        "accuracy": float(np.mean(y_pred == y)),
        "confusion_matrix": cm.tolist(),
        "class_labels": unique_classes
    }
    joblib.dump(bundle, out_path)
    print(f"Saved complete Random Forest model bundle to: {out_path}")

import sys

if __name__ == "__main__":
    force = "--force-redownload" in sys.argv
    # Crawl 120 projects (càng nhiều càng tốt)
    success = download_raw_data(120, force_redownload=force)
    if success:
        df_norm = normalize_crawled_data()
        train_and_eval_risk_matrix(df_norm)
    else:
        print("Failed during raw data download.")
