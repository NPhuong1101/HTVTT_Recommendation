import sys
import json
import os
from datetime import datetime
import uuid
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import csv

vietnamese_stopwords = {"là", "của", "và", "có", "cho", "với", "các", "những", "một",
                        "này", "đó", "được", "trong", "khi", "đã", "tại", "theo",
                        "rằng", "nên", "thì", "ra", "vẫn", "vì", "nơi", "đến", "từ"}

def remove_stopwords(text, stopwords):
    words = text.lower().split()
    return " ".join([word for word in words if word not in stopwords])

def save_recommendations(user_id, source_place_ids, recommended_place_ids):
    """Lưu gợi ý: mỗi dòng gồm user_id, source_place_ids, recommended_place_ids"""
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        current_dir = os.path.dirname(os.path.abspath(__file__))
        recommendations_file = os.path.join(current_dir, "../public/data/recommendations.csv")

        os.makedirs(os.path.dirname(recommendations_file), exist_ok=True)

        # Ghi header nếu chưa tồn tại
        if not os.path.exists(recommendations_file):
            with open(recommendations_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['user_id', 'source_place_ids', 'recommended_place_ids', 'timestamp'])

        # Ghi dòng dữ liệu
        with open(recommendations_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                user_id,
                '|'.join(map(str, source_place_ids)),
                '|'.join(map(str, recommended_place_ids)),
                timestamp
            ])

        return True
    except Exception as e:
        print(f"Error saving recommendations: {str(e)}", file=sys.stderr)
        return False

def main():
    try:
        # Đặt encoding mặc định cho stdout
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(current_dir, "../public/data/Info-trip.csv")
        
        # Đọc file CSV với encoding UTF-8
        data = pd.read_csv(csv_path, encoding="utf-8")
        
        # Đổi tên cột tiếng Việt sang tiếng Anh
        column_map = {
            'Tên địa điểm': 'title',
            'Mô tả': 'description',
            'Thể loại': 'category',
            'Tỉnh thành': 'location',
            'ID Ảnh URL địa điểm': 'image',
            'Link google map': 'map_link'
        }
        data = data.rename(columns=column_map)
        
        # Kiểm tra các cột bắt buộc
        required_columns = ['id', 'title', 'description', 'category', 'location']
        for col in required_columns:
            if col not in data.columns:
                raise ValueError(f"Missing required column: {col}")
        
        # Xử lý dữ liệu
        data = data.fillna("")
        data["content"] = data["description"] + " " + data["category"] + " " + data["location"]
        data["content"] = data["content"].apply(lambda x: remove_stopwords(x, vietnamese_stopwords))

        # Tạo TF-IDF matrix
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(data["content"])
        cosine_sim = cosine_similarity(tfidf_matrix)

        # Nhận tham số từ command line
        if len(sys.argv) < 3:
            return {"error": "Missing arguments"}
            
        *place_ids_str, user_id_str = sys.argv[1:]
        input_ids = [int(x.strip()) for x in place_ids_str]
        user_id = user_id_str.strip()

        # Tìm các địa điểm tương tự
        data["id"] = pd.to_numeric(data["id"], errors="coerce").astype("Int64")
        input_indices = data[data["id"].isin(input_ids)].index.tolist()

        if not input_indices:
            return {"recommendations": []}

        total_sim = sum(cosine_sim[i] for i in input_indices)
        total_sim[input_indices] = 0  # Loại bỏ các địa điểm đầu vào

        # Sắp xếp các địa điểm theo độ tương đồng giảm dần
        sim_scores = list(enumerate(total_sim))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[:5]

        # Trả về top 5 địa điểm có điểm số cao nhất làm gợi ý
        recommended = data.iloc[[i[0] for i in sim_scores]]
        result = recommended[["id", "title", "description", "category", "location", "image", "map_link"]].to_dict(orient="records")

        # Lưu recommendations
        recommended_ids = [place["id"] for place in result]
        save_recommendations(user_id, input_ids, recommended_ids)

        return {
            "recommendations": result
        }

        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        # Đặt encoding cho toàn bộ chương trình
        import io
        import sys
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
        
        result = main()
        print(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)