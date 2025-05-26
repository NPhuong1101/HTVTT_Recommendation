import pandas as pd
from collections import defaultdict
import os

def load_recommendations(path):
    """Tải dữ liệu gợi ý từ CSV"""
    df = pd.read_csv(path)
    recs = defaultdict(list)
    for _, row in df.iterrows():
        key = (str(row['user_id']), str(row['source_place_ids']))
        recs[key] = str(row['recommended_place_ids']).split('|')
    return recs

def load_ground_truth(path):
    """Tải dữ liệu ground truth từ CSV"""
    df = pd.read_csv(path)
    gt = defaultdict(list)
    for _, row in df.iterrows():
        key = (str(row['user_id']), str(row['source_place_id']))
        gt[key] = str(row['clicked_place_ids']).split('|')
    return gt

def load_all_items(path):
    """Tải tất cả các địa điểm từ Info-trip.csv"""
    df = pd.read_csv(path)
    return set(df['id'].astype(str).unique())

def load_user_history(path):
    """Tải lịch sử du lịch của người dùng"""
    df = pd.read_csv(path)
    history = defaultdict(set)
    for _, row in df.iterrows():
        user_id = str(row['user_id'])
        place_id = str(row['place_id'])
        history[user_id].add(place_id)
    return history

def evaluate(recommendations, ground_truth, all_items, user_history, k=5):
    """Đánh giá hệ thống gợi ý"""
    metrics = {
        'Precision@k': [],
        'Recall@k': [],
        'F1@k': [],
        'AP@k': []
    }

    # Tính coverage
    all_recommended = set()
    for recs in recommendations.values():
        all_recommended.update(recs[:k])
    coverage = len(all_recommended) / len(all_items) if all_items else 0

    # Đánh giá từng cặp (user_id, source_place_id)
    for key in ground_truth:
        if key not in recommendations:
            continue

        user_id = key[0]
        pred = recommendations[key][:k]
        actual = ground_truth[key]

        pred_set = set(pred)
        actual_set = set(actual)

        tp = len(pred_set & actual_set)
        fp = len(pred_set - actual_set)

        # Tổng số mục đúng là tổng số địa điểm user đã du lịch
        relevant_set = user_history.get(user_id, set())
        fn = len(relevant_set - pred_set)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        # Average Precision
        ap = 0
        hits = 0
        for i, item in enumerate(pred, 1):
            if item in actual_set:
                hits += 1
                ap += hits / i
        ap /= len(actual) if actual else 1

        metrics['Precision@k'].append(precision)
        metrics['Recall@k'].append(recall)
        metrics['F1@k'].append(f1)
        metrics['AP@k'].append(ap)

    results = {
        'Precision@k': sum(metrics['Precision@k']) / len(metrics['Precision@k']) if metrics['Precision@k'] else 0,
        'Recall@k': sum(metrics['Recall@k']) / len(metrics['Recall@k']) if metrics['Recall@k'] else 0,
        'F1@k': sum(metrics['F1@k']) / len(metrics['F1@k']) if metrics['F1@k'] else 0,
        'MAP@k': sum(metrics['AP@k']) / len(metrics['AP@k']) if metrics['AP@k'] else 0,
        'Coverage': coverage
    }

    return results

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))

    recs_path = os.path.join(current_dir, "../public/data/recommendations.csv")
    gt_path = os.path.join(current_dir, "../public/data/ground_truth.csv")
    items_path = os.path.join(current_dir, "../public/data/Info-trip.csv")
    history_path = os.path.join(current_dir, "../public/data/user_travel_history.csv")

    recommendations = load_recommendations(recs_path)
    ground_truth = load_ground_truth(gt_path)
    all_items = load_all_items(items_path)
    user_history = load_user_history(history_path)

    results = evaluate(recommendations, ground_truth, all_items, user_history, k=5)

    print("\n=== Evaluation Results ===")
    for metric, value in results.items():
        print(f"{metric}: {value:.4f}")

if __name__ == "__main__":
    main()