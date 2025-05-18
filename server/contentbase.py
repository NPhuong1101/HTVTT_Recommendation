import pandas as pd
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Đường dẫn tới CSV
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, "../public/data/Info-trip.csv")

try:
    data = pd.read_csv(csv_path, encoding="utf-8")
    data.rename(columns={
        "Tên địa điểm": "title",
        "Mô tả": "description",
        "Thể loại": "category",
        "Tỉnh thành": "location",
        "ID Ảnh URL địa điểm": "image",
        "Link google map": "map_link"
    }, inplace=True)

    data = data.fillna("")
    data["content"] = data["description"] + " " + data["category"] + " " + data["location"]

    if data["content"].isnull().any() or data["content"].str.strip().eq("").all():
        print("❌ [ERROR] Lỗi dữ liệu trong 'content'", file=sys.stderr)
        sys.exit(1)

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(data["content"])
    cosine_sim = cosine_similarity(tfidf_matrix)

except Exception as e:
    import traceback
    print("❌ [ERROR] Failed loading or processing CSV:", file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)

# Nhận danh sách ID
if len(sys.argv) < 2:
    print(json.dumps([]))
    sys.exit()

try:
    input_ids = [int(x.strip()) for x in sys.argv[1:]]
except ValueError:
    print("❌ [ERROR] ID không hợp lệ", file=sys.stderr)
    print(json.dumps([]))
    sys.exit()

data["id"] = pd.to_numeric(data["id"], errors="coerce").astype("Int64")

input_indices = data[data["id"].isin(input_ids)].index.tolist()

if not input_indices:
    print(json.dumps([]))
    sys.exit()

# Gộp điểm tương đồng từ các địa điểm đầu vào
total_sim = sum(cosine_sim[i] for i in input_indices)

# Trung bình điểm nếu muốn, hoặc giữ nguyên
total_sim[input_indices] = 0  # Bỏ chính các địa điểm đầu vào

# Lấy top 5 địa điểm tương đồng nhất (không trùng lặp)
sim_scores = list(enumerate(total_sim))
sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[:5]

recommended = data.iloc[[i[0] for i in sim_scores]]
result = recommended[["title", "description", "category", "location", "image", "map_link"]].to_dict(orient="records")

print(json.dumps(result, ensure_ascii=False))