import pandas as pd
from collections import defaultdict
import os
from collections import Counter
import math

def evaluate_recommendation_system(recommendations, ground_truth, all_items):
    total_users = len(ground_truth)
    precision_list, recall_list, f1_list, ap_list = [], [], [], []
    item_counts = Counter()

    for recs in recommendations.values():
        item_counts.update(recs)

    recommended_items = set()

    for user in ground_truth:
        pred = recommendations.get(user, [])
        actual = ground_truth[user]
        pred_set = set(pred)
        actual_set = set(actual)

        # Precision, Recall, F1
        tp = len(pred_set & actual_set)
        fp = len(pred_set - actual_set)
        fn = len(actual_set - pred_set)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        precision_list.append(precision)
        recall_list.append(recall)
        f1_list.append(f1)

        # MAP
        hits = 0
        sum_precisions = 0
        for i, item in enumerate(pred):
            if item in actual_set:
                hits += 1
                sum_precisions += hits / (i + 1)
        ap = sum_precisions / len(actual) if actual else 0
        ap_list.append(ap)

        # Coverage
        recommended_items.update(pred)

    precision_avg = sum(precision_list) / total_users
    recall_avg = sum(recall_list) / total_users
    f1_avg = sum(f1_list) / total_users
    map_score = sum(ap_list) / total_users
    coverage_score = len(recommended_items) / len(all_items) if all_items else 0

    return {
        'Precision': precision_avg,
        'Recall': recall_avg,
        'F1-score': f1_avg,
        'MAP': map_score,
        'Coverage': coverage_score
    }

# Đọc file recommendations.csv
def load_recommendations(path):
    df = pd.read_csv(path)
    recs = {}
    for _, row in df.iterrows():
        user = row["user_id"]
        items = row["recommendations"].split("|")
        recs[user] = items
    return recs

# Đọc file ground_truth.csv
def load_ground_truth(path):
    df = pd.read_csv(path)
    gt = {}
    for _, row in df.iterrows():
        user = row["user_id"]
        items = row["actual"].split("|")
        gt[user] = items
    return gt

# Đọc danh sách toàn bộ item từ Info-trip.csv
def load_all_items(path):
    df = pd.read_csv(path)
    return set(df["Tên địa điểm"].dropna().unique())

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))

    recommendations = load_recommendations(os.path.join(current_dir, "recommendations.csv"))
    ground_truth = load_ground_truth(os.path.join(current_dir, "ground_truth.csv"))
    all_items = load_all_items(os.path.join(current_dir, "Info-trip.csv"))

    result = evaluate_recommendation_system(recommendations, ground_truth, all_items)

    for k, v in result.items():
        print(f"{k}: {v:.4f}")

if __name__ == "__main__":
    main()