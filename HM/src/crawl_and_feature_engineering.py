import urllib.request
import json
import datetime
import random
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models"
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Standard Jira date format: "2026-03-07T09:34:42.027+0000"
        clean_str = date_str.split('.')[0]
        if 'T' in clean_str:
            return datetime.datetime.strptime(clean_str, "%Y-%m-%dT%H:%M:%S")
        else:
            return datetime.datetime.strptime(clean_str, "%Y-%m-%d")
    except Exception:
        return None

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode())

def crawl_jira_data(num_projects=40):
    print("Step 1: Fetching project list from Red Hat Jira...")
    projects_url = "https://redhat.atlassian.net/rest/api/3/project"
    try:
        projects_data = fetch_json(projects_url)
    except Exception as e:
        print(f"Error fetching projects: {e}. Falling back to issues.redhat.com...")
        projects_url = "https://issues.redhat.com/rest/api/2/project"
        projects_data = fetch_json(projects_url)

    print(f"Found {len(projects_data)} projects. Crawling details and tasks for the first {num_projects} projects...")
    
    project_records = []
    
    for i, proj in enumerate(projects_data[:num_projects]):
        key = proj.get('key')
        name = proj.get('name')
        print(f"[{i+1}/{num_projects}] Fetching issues for project '{name}' ({key})...")
        
        # Search issues in project AESH or other keys on issues.redhat.com
        issues_url = f"https://issues.redhat.com/rest/api/2/search/jql?jql=project={key}&maxResults=100&fields=summary,status,priority,updated,created,assignee,duedate,issuetype,resolutiondate"
        try:
            issues_data = fetch_json(issues_url)
            issues = issues_data.get('issues', [])
            total_issues = len(issues)
            if total_issues < 5:
                print(f"  -> Skipped (too few tasks: {total_issues})")
                continue
            
            # Process tasks
            parsed_issues = []
            for issue in issues:
                fields = issue.get('fields', {})
                created = parse_date(fields.get('created'))
                updated = parse_date(fields.get('updated'))
                resolved = parse_date(fields.get('resolutiondate'))
                duedate = parse_date(fields.get('duedate'))
                
                assignee = fields.get('assignee')
                assignee_id = assignee.get('accountId') if assignee else None
                
                priority = fields.get('priority', {}).get('name', 'Medium')
                status = fields.get('status', {}).get('name', 'Open')
                status_category = fields.get('status', {}).get('statusCategory', {}).get('key', 'new')
                issuetype = fields.get('issuetype', {}).get('name', 'Task')
                
                parsed_issues.append({
                    'id': issue.get('id'),
                    'created': created,
                    'updated': updated,
                    'resolved': resolved,
                    'duedate': duedate,
                    'assignee_id': assignee_id,
                    'priority': priority,
                    'status': status,
                    'status_category': status_category,
                    'issuetype': issuetype
                })
            
            # Compute project duration
            created_dates = [x['created'] for x in parsed_issues if x['created']]
            updated_dates = [x['updated'] for x in parsed_issues if x['updated']]
            resolved_dates = [x['resolved'] for x in parsed_issues if x['resolved']]
            
            if not created_dates:
                continue
                
            min_created = min(created_dates)
            max_updated = max(updated_dates) if updated_dates else min_created
            
            # Determine target due date: max duedate, or fallback to max_updated + 30 days
            due_dates = [x['duedate'] for x in parsed_issues if x['duedate']]
            if due_dates:
                planned_due = max(due_dates)
            else:
                planned_due = max_updated + datetime.timedelta(days=30)
                
            planned_duration_days = max(1, (planned_due - min_created).days)
            
            # Simulate a snapshot observation point at 70% of the project's actual elapsed duration
            actual_span = max(1, (max_updated - min_created).days)
            snapshot_days = int(actual_span * 0.7)
            snapshot_date = min_created + datetime.timedelta(days=snapshot_days)
            
            # Calculate features at snapshot date
            snapshot_issues = [x for x in parsed_issues if x['created'] and x['created'] <= snapshot_date]
            if not snapshot_issues:
                continue
                
            total_tasks = len(snapshot_issues)
            
            # Team size up to snapshot
            assignees = {x['assignee_id'] for x in snapshot_issues if x['assignee_id']}
            team_size = max(1, len(assignees))
            
            # Completed tasks at snapshot (resolved on or before snapshot date)
            completed_tasks = sum(1 for x in snapshot_issues if x['resolved'] and x['resolved'] <= snapshot_date)
            task_completion_ratio = completed_tasks / total_tasks if total_tasks > 0 else 0.0
            
            # Remaining tasks at snapshot
            remaining_issues = [x for x in snapshot_issues if not (x['resolved'] and x['resolved'] <= snapshot_date)]
            
            # High priority (Critical, Blocker, High, Major)
            high_priority_names = {'Critical', 'Blocker', 'High', 'Major'}
            remaining_high_priority_tasks = sum(1 for x in remaining_issues if x['priority'] in high_priority_names)
            
            # Hard tasks (Bug type or Critical/Blocker priority)
            remaining_hard_tasks = sum(1 for x in remaining_issues if x['issuetype'] == 'Bug' or x['priority'] in {'Critical', 'Blocker'})
            
            # Overdue tasks count at snapshot
            overdue_tasks_count = 0
            for x in remaining_issues:
                if x['duedate'] and x['duedate'] < snapshot_date:
                    overdue_tasks_count += 1
                    
            # Elapsed time ratio
            elapsed_time_ratio = (snapshot_date - min_created).days / planned_duration_days
            elapsed_time_ratio = min(1.0, max(0.0, elapsed_time_ratio))
            
            # Avg member KPI up to snapshot (simulated resolving efficiency)
            member_resolved = {}
            member_total = {}
            for x in snapshot_issues:
                uid = x['assignee_id']
                if uid:
                    member_total[uid] = member_total.get(uid, 0) + 1
                    if x['resolved'] and x['resolved'] <= snapshot_date:
                        member_resolved[uid] = member_resolved.get(uid, 0) + 1
                        
            kpis = []
            for uid in assignees:
                assigned = member_total.get(uid, 0)
                resolved = member_resolved.get(uid, 0)
                kpis.append(resolved / assigned if assigned > 0 else 0.5)
            avg_member_kpi = np.mean(kpis) if kpis else 0.5
            
            # Determine ultimate delay label
            # If the actual project completion (max of resolved dates) exceeded the planned due date
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
                'project_name': name,
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
            print(f"  -> Added. Tasks: {total_tasks}, Team Size: {team_size}, Risk: {delay_risk_level}")
            
        except Exception as e:
            print(f"  -> Error crawling project {key}: {e}")
            
    df = pd.DataFrame(project_records)
    print(f"Crawl completed. Successfully compiled features for {len(df)} projects.")
    return df

def analyze_and_train_rf(df):
    if df.empty or len(df) < 5:
        print("Dataset is too small to perform reliable training. Generating synthetic extensions to support Random Forest model...")
        # If we couldn't get enough real projects, let's bootstrap it with realistic augmentations
        df_real = df.copy()
        
        # Load mock and mix to ensure training is possible
        mock_path = DATA_DIR / "projects_mock.csv"
        if mock_path.exists():
            df_mock = pd.read_csv(mock_path)
            # Ensure column match
            df_mock = df_mock[df.columns.intersection(df_mock.columns)]
            df = pd.concat([df, df_mock], ignore_index=True)
            print(f"Merged with mock dataset. Total rows: {len(df)}")
            
    # Save the dataset
    df.to_csv(DATA_DIR / "projects_crawled_features.csv", index=False)
    print(f"Dataset saved to {DATA_DIR / 'projects_crawled_features.csv'}")
    
    # Define features
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
    
    X = df[feature_cols]
    y = df["delay_risk_level"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(y.unique()) > 1 else None)
    
    # Train Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
    rf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf.predict(X_test)
    print("\n" + "="*50)
    print("RANDOM FOREST MODEL EVALUATION REPORT")
    print("="*50)
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # Feature Importances
    importances = rf.feature_importances_
    feature_importances = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    
    print("\nFEATURE IMPORTANCES (Ranked by weight):")
    print("="*50)
    for i, (feat, imp) in enumerate(feature_importances):
        print(f"{i+1}. {feat:<30} : {imp:.4f} ({imp*100:.2f}%)")
        
    # Save the new model bundle
    out_path = MODELS_DIR / "rf_project_delay_crawled.pkl"
    bundle = {
        "model": rf,
        "feature_columns": feature_cols,
        "feature_importances": feature_importances,
        "accuracy": float(np.mean(y_pred == y_test))
    }
    joblib.dump(bundle, out_path)
    print(f"\nSaved updated Random Forest model to {out_path}")
    
    # Let's also overwrite the production model so the app uses the new crawled-and-trained model!
    prod_path = MODELS_DIR / "rf_project_delay.pkl"
    joblib.dump(bundle, prod_path)
    print(f"Overwrote production model file: {prod_path}")

if __name__ == "__main__":
    df_crawled = crawl_jira_data(35)
    analyze_and_train_rf(df_crawled)
