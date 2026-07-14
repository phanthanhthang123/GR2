"""
Tiền xử lý toàn bộ cơ sở dữ liệu MongoDB JiraReposAnon.
Trích xuất:
1. data_B_real.csv: Dữ liệu thật cho Model B (Internal KPI)
2. projects_real.csv: Dữ liệu thật cho Model RF (Project Delay Risk)
"""

from pymongo import MongoClient
import pandas as pd
import numpy as np
import datetime
from pathlib import Path
import sys

# Setup Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

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

def main():
    print("=" * 60)
    print("STARTING JIRA DATASET PREPROCESSING FROM MONGO...")
    print("=" * 60)
    
    client = MongoClient("mongodb://localhost:27017/")
    db = client["JiraReposAnon"]
    
    collections = db.list_collection_names()
    if not collections:
        print("Error: No collections found in JiraReposAnon database. Please wait for mongorestore to complete.")
        sys.exit(1)
        
    print(f"Found {len(collections)} collections: {collections}")
    
    # Dictionaries to aggregate stats
    # Key: {collection_name}_{user_key}
    user_projects = {}
    user_tasks_count = {}
    user_hard_tasks_count = {}
    user_resolved_count = {}
    user_dates = {}
    user_names = {}
    
    # Key: {collection_name}_{project_key}
    # List of issues in project
    project_issues = {}
    
    projection = {
        "key": 1,
        "fields.project.key": 1,
        "fields.assignee.key": 1,
        "fields.assignee.name": 1,
        "fields.assignee.displayName": 1,
        "fields.created": 1,
        "fields.updated": 1,
        "fields.resolutiondate": 1,
        "fields.duedate": 1,
        "fields.priority.name": 1,
        "fields.issuetype.name": 1,
        "fields.status.name": 1
    }
    
    for col_name in collections:
        col = db[col_name]
        print(f"Reading collection: {col_name}...")
        cursor = col.find({}, projection)
        
        count = 0
        for doc in cursor:
            fields = doc.get("fields", {})
            if not fields:
                continue
                
            proj = fields.get("project")
            if not proj or not proj.get("key"):
                continue
            
            proj_key = f"{col_name}_{proj.get('key')}"
            
            created = parse_date(fields.get("created"))
            updated = parse_date(fields.get("updated"))
            resolved = parse_date(fields.get("resolutiondate"))
            duedate = parse_date(fields.get("duedate"))
            
            priority = fields.get("priority", {}).get("name", "Medium") if fields.get("priority") else "Medium"
            issuetype = fields.get("issuetype", {}).get("name", "Task") if fields.get("issuetype") else "Task"
            status = fields.get("status", {}).get("name", "Open") if fields.get("status") else "Open"
            
            assignee = fields.get("assignee")
            assignee_id = None
            display_name = "Unknown"
            if assignee:
                # In anonymized data, try to use name, key or accountId
                assignee_id = assignee.get("name") or assignee.get("key") or assignee.get("accountId")
                display_name = assignee.get("displayName", "Unknown")
                
            # Store issue in project_issues
            if proj_key not in project_issues:
                project_issues[proj_key] = []
                
            project_issues[proj_key].append({
                "key": doc.get("key"),
                "created": created,
                "updated": updated,
                "resolved": resolved,
                "duedate": duedate,
                "assignee_id": f"{col_name}_{assignee_id}" if assignee_id else None,
                "priority": priority,
                "issuetype": issuetype,
                "status": status
            })
            
            # If there's a valid assignee, aggregate user stats
            if assignee_id:
                uid = f"{col_name}_{assignee_id}"
                user_names[uid] = display_name
                
                if uid not in user_projects:
                    user_projects[uid] = set()
                user_projects[uid].add(proj_key)
                
                user_tasks_count[uid] = user_tasks_count.get(uid, 0) + 1
                
                is_hard = (issuetype == "Bug") or (priority in ["Critical", "Blocker", "High", "Major"])
                if is_hard:
                    user_hard_tasks_count[uid] = user_hard_tasks_count.get(uid, 0) + 1
                    
                if resolved:
                    user_resolved_count[uid] = user_resolved_count.get(uid, 0) + 1
                    
                if created:
                    if uid not in user_dates:
                        user_dates[uid] = []
                    user_dates[uid].append(created)
                    
            count += 1
            if count % 100000 == 0:
                print(f"  Processed {count} documents...")
                
        print(f"Completed collection {col_name}. Total processed: {count}")
        
    print("\n" + "=" * 60)
    print("PROCESSING USER PERFORMANCE PROFILES (MODEL B)...")
    print("=" * 60)
    
    real_users_with_meta = []
    real_users_for_training = []
    
    for uid in user_tasks_count:
        tot_tasks = user_tasks_count[uid]
        if tot_tasks < 3: # Filter out passive users
            continue
            
        tot_projs = len(user_projects.get(uid, set()))
        hard_tasks = user_hard_tasks_count.get(uid, 0)
        resolved = user_resolved_count.get(uid, 0)
        
        dates = user_dates.get(uid, [])
        if len(dates) >= 2:
            tenure_days = (max(dates) - min(dates)).days
            yac = max(0.1, round(tenure_days / 365.25, 2))
        else:
            yac = 0.1
        yac = min(10.0, max(0.1, yac))
        
        completion_rate = resolved / tot_tasks
        bug_ratio = hard_tasks / tot_tasks if tot_tasks > 0 else 0.0
        
        # Base KPI formula matching generate_data.py
        kpi_score = 0.5 + 0.4 * completion_rate - 0.25 * bug_ratio
        
        if bug_ratio > 0.4:
            kpi_score -= 0.15
        if tot_tasks > 30:
            kpi_score += 0.08
        if yac > 3.0:
            kpi_score += 0.05
            
        kpi_score = float(np.clip(kpi_score, 0.0, 1.0))
        
        real_users_with_meta.append({
            "user_id": uid,
            "display_name": user_names.get(uid, "Unknown"),
            "total_projects": int(tot_projs),
            "total_tasks": int(tot_tasks),
            "hard_tasks": int(hard_tasks),
            "years_at_company": float(yac),
            "KPI": float(np.round(kpi_score, 4))
        })
        
        real_users_for_training.append({
            "total_projects": int(tot_projs),
            "total_tasks": int(tot_tasks),
            "hard_tasks": int(hard_tasks),
            "years_at_company": float(yac),
            "KPI": float(np.round(kpi_score, 4))
        })
        
    df_users_meta = pd.DataFrame(real_users_with_meta)
    df_users_meta.to_csv(DATA_DIR / "users_kpi_real.csv", index=False)
    print(f"Saved metadata users file ({len(df_users_meta)} users) to: {DATA_DIR / 'users_kpi_real.csv'}")
    
    df_users = pd.DataFrame(real_users_for_training)
    print(f"Extracted {len(df_users)} active real users from MongoDB.")
    
    # Resample/Augment to exactly 5000 rows
    target_users_count = 5000
    if len(df_users) == 0:
        print("Warning: No active users found. Creating dummy user dataframe.")
        df_users = pd.DataFrame(columns=["total_projects", "total_tasks", "hard_tasks", "years_at_company", "KPI"])
        
    if len(df_users) < target_users_count:
        print(f"Bootstrapping users from {len(df_users)} to {target_users_count}...")
        needed = target_users_count - len(df_users)
        df_resampled = df_users.sample(n=needed, replace=True, random_state=42).copy()
        
        # Add slight realistic noise to break identical rows
        rng = np.random.default_rng(42)
        df_resampled["total_tasks"] = np.clip(df_resampled["total_tasks"] + rng.integers(-2, 3, size=needed), 3, 320).astype(int)
        df_resampled["total_projects"] = np.clip(df_resampled["total_projects"] + rng.integers(-1, 2, size=needed), 1, 15).astype(int)
        df_resampled["hard_tasks"] = np.clip(df_resampled["hard_tasks"] + rng.integers(-1, 2, size=needed), 0, df_resampled["total_tasks"]).astype(int)
        df_resampled["years_at_company"] = np.clip(np.round(df_resampled["years_at_company"] + rng.normal(0, 0.15, size=needed), 2), 0.1, 10.0)
        
        # Recalculate KPI with minor noise
        for idx in range(needed):
            row = df_resampled.iloc[idx]
            new_kpi = np.clip(row["KPI"] + rng.normal(0, 0.04), 0.0, 1.0)
            df_resampled.iloc[idx, df_resampled.columns.get_loc("KPI")] = float(np.round(new_kpi, 4))
            
        df_users_final = pd.concat([df_users, df_resampled], ignore_index=True)
    else:
        print(f"Sampling exactly {target_users_count} users from {len(df_users)}...")
        df_users_final = df_users.sample(n=target_users_count, replace=False, random_state=42).reset_index(drop=True)
        
    df_users_final = df_users_final.iloc[np.random.default_rng(42).permutation(len(df_users_final))].reset_index(drop=True)
    df_users_final.to_csv(DATA_DIR / "data_B_real.csv", index=False)
    print(f"Saved training-ready data_B_real.csv to: {DATA_DIR / 'data_B_real.csv'}")
    
    print("\n" + "=" * 60)
    print("PROCESSING PROJECT TIMELINE SNAPSHOTS (MODEL RF)...")
    print("=" * 60)
    
    project_records = []
    
    # Process each project key
    for proj_key, issues in project_issues.items():
        if len(issues) < 10:  # Filter out projects with too few tasks
            continue
            
        created_dates = [x["created"] for x in issues if x["created"]]
        updated_dates = [x["updated"] for x in issues if x["updated"]]
        resolved_dates = [x["resolved"] for x in issues if x["resolved"]]
        
        if not created_dates:
            continue
            
        min_created = min(created_dates)
        max_updated = max(updated_dates) if updated_dates else min_created
        
        due_dates = [x["duedate"] for x in issues if x["duedate"]]
        planned_due = max(due_dates) if due_dates else max_updated + datetime.timedelta(days=30)
        planned_duration_days = max(1, (planned_due - min_created).days)
        
        # 70% timeline snapshot
        snapshot_date = min_created + datetime.timedelta(days=int(planned_duration_days * 0.7))
        
        # Issues created on or before snapshot
        snapshot_issues = [x for x in issues if x["created"] and x["created"] <= snapshot_date]
        if not snapshot_issues:
            continue
            
        total_tasks = len(snapshot_issues)
        assignees = {x["assignee_id"] for x in snapshot_issues if x["assignee_id"]}
        team_size = max(1, len(assignees))
        
        # Completed tasks at snapshot
        completed_tasks = sum(1 for x in snapshot_issues if x["resolved"] and x["resolved"] <= snapshot_date)
        task_completion_ratio = completed_tasks / total_tasks if total_tasks > 0 else 0.0
        
        # Remaining tasks at snapshot
        remaining_issues = [x for x in snapshot_issues if not (x["resolved"] and x["resolved"] <= snapshot_date)]
        
        high_priority_names = {"Critical", "Blocker", "High", "Major"}
        remaining_high_priority_tasks = sum(1 for x in remaining_issues if x["priority"] in high_priority_names)
        remaining_hard_tasks = sum(1 for x in remaining_issues if x["issuetype"] == "Bug" or x["priority"] in {"Critical", "Blocker"})
        
        overdue_tasks_count = sum(1 for x in remaining_issues if x["duedate"] and x["duedate"] < snapshot_date)
        
        elapsed_time_ratio = (snapshot_date - min_created).days / planned_duration_days
        elapsed_time_ratio = min(1.0, max(0.0, elapsed_time_ratio))
        
        # Average member KPI based on completion rate of assignees up to snapshot
        member_resolved = {}
        member_total = {}
        for x in snapshot_issues:
            uid = x["assignee_id"]
            if uid:
                member_total[uid] = member_total.get(uid, 0) + 1
                if x["resolved"] and x["resolved"] <= snapshot_date:
                    member_resolved[uid] = member_resolved.get(uid, 0) + 1
                    
        kpis = [member_resolved.get(uid, 0) / member_total.get(uid, 0) for uid in assignees if member_total.get(uid, 0) > 0]
        avg_member_kpi = np.mean(kpis) if kpis else 0.5
        
        # Actual project duration and delay
        actual_end = max(resolved_dates) if resolved_dates else max_updated
        delay_days = (actual_end - planned_due).days
        
        if delay_days > 15:
            delay_risk_level = "High"
        elif delay_days > 0:
            delay_risk_level = "Medium"
        else:
            delay_risk_level = "Low"
            
        project_records.append({
            "project_key": proj_key,
            "team_size": team_size,
            "planned_duration_days": planned_duration_days,
            "total_tasks": total_tasks,
            "remaining_hard_tasks": remaining_hard_tasks,
            "remaining_high_priority_tasks": remaining_high_priority_tasks,
            "elapsed_time_ratio": elapsed_time_ratio,
            "task_completion_ratio": task_completion_ratio,
            "overdue_tasks_count": overdue_tasks_count,
            "avg_member_kpi": avg_member_kpi,
            "delay_risk_level": delay_risk_level
        })
        
    df_projects = pd.DataFrame(project_records)
    print(f"Extracted {len(df_projects)} valid projects with 10+ issues from MongoDB.")
    
    # Resample/Augment to exactly 2000 rows
    target_projects_count = 2000
    if len(df_projects) == 0:
        print("Warning: No valid projects found. Creating dummy projects dataframe.")
        df_projects = pd.DataFrame(columns=[
            "project_key", "team_size", "planned_duration_days", "total_tasks",
            "remaining_hard_tasks", "remaining_high_priority_tasks", "elapsed_time_ratio",
            "task_completion_ratio", "overdue_tasks_count", "avg_member_kpi", "delay_risk_level"
        ])
        
    if len(df_projects) < target_projects_count:
        print(f"Bootstrapping projects from {len(df_projects)} to {target_projects_count}...")
        needed = target_projects_count - len(df_projects)
        df_resampled = df_projects.sample(n=needed, replace=True, random_state=42).copy()
        
        # Add slight realistic noise to break identical rows
        rng = np.random.default_rng(42)
        df_resampled["team_size"] = np.clip(df_resampled["team_size"] + rng.integers(-1, 2, size=needed), 1, 100).astype(int)
        df_resampled["planned_duration_days"] = np.clip(df_resampled["planned_duration_days"] + rng.integers(-10, 11, size=needed), 10, 1000).astype(int)
        df_resampled["total_tasks"] = np.clip(df_resampled["total_tasks"] + rng.integers(-5, 6, size=needed), 10, 5000).astype(int)
        df_resampled["remaining_hard_tasks"] = np.clip(df_resampled["remaining_hard_tasks"] + rng.integers(-2, 3, size=needed), 0, df_resampled["total_tasks"]).astype(int)
        df_resampled["remaining_high_priority_tasks"] = np.clip(df_resampled["remaining_high_priority_tasks"] + rng.integers(-2, 3, size=needed), 0, df_resampled["total_tasks"]).astype(int)
        df_resampled["overdue_tasks_count"] = np.clip(df_resampled["overdue_tasks_count"] + rng.integers(-2, 3, size=needed), 0, df_resampled["total_tasks"]).astype(int)
        df_resampled["avg_member_kpi"] = np.clip(df_resampled["avg_member_kpi"] + rng.normal(0, 0.05, size=needed), 0.0, 1.0)
        
        # Make sure hard tasks don't exceed total_tasks
        df_resampled["remaining_hard_tasks"] = np.minimum(df_resampled["remaining_hard_tasks"], df_resampled["total_tasks"])
        df_resampled["remaining_high_priority_tasks"] = np.minimum(df_resampled["remaining_high_priority_tasks"], df_resampled["total_tasks"])
        df_resampled["overdue_tasks_count"] = np.minimum(df_resampled["overdue_tasks_count"], df_resampled["total_tasks"])
        
        df_projects_final = pd.concat([df_projects, df_resampled], ignore_index=True)
    else:
        print(f"Sampling exactly {target_projects_count} projects from {len(df_projects)}...")
        df_projects_final = df_projects.sample(n=target_projects_count, replace=False, random_state=42).reset_index(drop=True)
        
    df_projects_final = df_projects_final.iloc[np.random.default_rng(42).permutation(len(df_projects_final))].reset_index(drop=True)
    
    # Save the training ready CSV
    df_projects_final.to_csv(DATA_DIR / "projects_real.csv", index=False)
    print(f"Saved training-ready projects_real.csv to: {DATA_DIR / 'projects_real.csv'}")
    
    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
