import random
import sys
from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from flask import Flask, request, jsonify
import pandas as pd
from suggest import get_suggestions
import csv
import uuid
from datetime import datetime
import traceback
import subprocess
import requests
import json

# Đường dẫn đến file CSV
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, '../public/data')
USERS_CSV = os.path.join(DATA_DIR, 'users.csv')
TRAVEL_HISTORY_CSV = os.path.join(DATA_DIR, 'user_travel_history.csv')
INFO_TRIP_CSV = os.path.join(DATA_DIR, 'Info-trip.csv')
RECOMMENDATIONS_CSV = os.path.join(DATA_DIR, 'recommendations.csv')
GROUND_TRUTH_CSV = os.path.join(DATA_DIR, 'ground_truth.csv')


app = Flask(__name__)
CORS(app)  # Bật CORS cho tất cả routes

@app.route('/api/proxy/<path:subpath>', methods=['POST', 'GET'])
def proxy(subpath):
    url = f"https://extensions.aitopia.ai/{subpath}"
    headers = {'Content-Type': 'application/json'}

    if request.method == 'POST':
        res = requests.post(url, headers=headers, json=request.get_json())
    else:
        res = requests.get(url, headers=headers, params=request.args)

    return (res.content, res.status_code, res.headers.items())

# Route cho trang chủ
@app.route('/')
def home():
    return """
    <h1>TravelVN Backend Server</h1>
    <p>API endpoints:</p>
    <ul>
        <li><a href="/api/suggest">/api/suggest</a> (POST)</li>
    </ul>
    """

# Gợi ý địa điểm du lịch trong Destination (gửi 1 id địa điểm vào contentbase.py)
@app.route('/api/suggest', methods=['POST'])
def suggest():
    try:
        data = request.get_json()
        place_id = data.get('id')
        user_id = data.get('user_id', '0')
        
        if not place_id:
            return jsonify({"error": "Place ID is required"}), 400

        place_ids = [place_id] if not isinstance(place_id, list) else place_id
        
        script_path = os.path.join(os.path.dirname(__file__), 'contentbase.py')
        args = [sys.executable, script_path] + [str(pid) for pid in place_ids] + [str(user_id)]
        
        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        # Debug logging
        print(f"Contentbase.py stdout: {result.stdout}")
        print(f"Contentbase.py stderr: {result.stderr}")
        
        try:
            result_data = json.loads(result.stdout)
            if "error" in result_data:
                return jsonify({"error": result_data["error"]}), 500
            return jsonify(result_data)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {e}")
            return jsonify({"error": "Invalid response from recommendation engine"}), 500
            
    except Exception as e:
        print(f"Error in suggest endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get-csv')
def get_csv():
    return send_from_directory('../public/data', 'Info-trip.csv')

# Đăng kí
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    new_email = data.get('email')
    
    if not new_email:
        return jsonify({"error": "Email là bắt buộc"}), 400

    users_csv_path = os.path.join(os.path.dirname(__file__), '../public/data/users.csv')
    print(f"[DEBUG] Path to users.csv: {users_csv_path}")

    # 🔍 Kiểm tra email đã tồn tại chưa
    if os.path.exists(users_csv_path):
        with open(users_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('email') == new_email:
                    return jsonify({"error": "Email đã tồn tại"}), 409

    # 🆕 Nếu email chưa tồn tại → tiếp tục tạo tài khoản
    user_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    with open(users_csv_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            user_id,
            data['name'],
            data['email'],
            data['password'],  # ➕ Nếu dùng bcrypt, thay bằng password đã mã hóa
            now
        ])

    # ✅ Ghi lịch sử nếu có
    if 'travelHistory' in data:
        history_csv_path = os.path.join(os.path.dirname(__file__), '../public/data/user_travel_history.csv')
        with open(history_csv_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            for place in data['travelHistory']:
                writer.writerow([
                    str(uuid.uuid4()),
                    user_id,
                    place['id'],
                    place.get('startDate', ''),
                    place.get('endDate', ''),
                    now
                ])

    return jsonify({
        "success": True,
        "user_id": user_id
    })

@app.route('/api/save-travel-history', methods=['POST'])
def save_travel_history():
    data = request.json
    
    with open(TRAVEL_HISTORY_CSV, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            str(uuid.uuid4()),
            data['userId'],
            data['placeId'],
            data['startDate'],
            data['endDate'],
            datetime.now().isoformat()
        ])
    
    return jsonify({"success": True})

# Tìm kiếm địa điểm
@app.route('/api/search-places', methods=['GET'])
def search_places():
    query = request.args.get('query', '').lower()
    try:
        csv_path = os.path.join(os.path.dirname(__file__), '../public/data/Info-trip.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({"error": "File not found"}), 404
            
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            results = []
            for row in reader:
                if (query in row['Tên địa điểm'].lower() or 
                    query in row['Tỉnh thành'].lower()):
                    results.append({
                        'id': row['id'],
                        'name': row['Tên địa điểm'],
                        'location': row['Tỉnh thành'],
                        'category': row['Thể loại'],
                        'image': row['ID Ảnh URL địa điểm']
                    })
                    if len(results) >= 10:
                        break
            return jsonify(results)
    except Exception as e:
        print(f"Error searching places: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/places', methods=['GET'])
def get_places():
    try:
        with open('data/Info-trip.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            places = list(reader)
        return jsonify(places)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lấy thông tin địa điểm dựa trên id
@app.route('/api/place/<id>', methods=['GET'])
def get_place(id):
    try:
        csv_path = os.path.join(os.path.dirname(__file__), '../public/data/Info-trip.csv')
        print(f"[DEBUG] Đường dẫn CSV: {csv_path}")

        if not os.path.exists(csv_path):
            print("[DEBUG] ❌ CSV không tồn tại")
            return jsonify({"error": "Data file not found", "path": csv_path}), 404

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            # In thử key để xác minh tên cột
            first_row = next(reader)
            print(f"[DEBUG] Row keys: {list(first_row.keys())}")
            f.seek(0)  # Reset lại đọc file từ đầu sau khi gọi next

            reader = csv.DictReader(f)  # đọc lại từ đầu sau khi next()
            for row in reader:
                # Chuẩn hóa key và tìm "id" bất kể viết hoa, khoảng trắng
                row_id = next((row[k] for k in row.keys() if k.strip().lower() == "id"), None)
                print(f"[DEBUG] So sánh row_id={row_id} với id={id}")
                if str(row_id).strip() == str(id).strip():
                    print("[DEBUG] ✅ Tìm thấy địa điểm khớp ID")
                    return jsonify(row)

            print("[DEBUG] ❌ Không tìm thấy địa điểm khớp ID")
            return jsonify({"error": "Place not found"}), 404

    except Exception as e:
        print(f"[DEBUG] ❌ Lỗi khi lấy địa điểm: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Lấy thông tin địa điểm nổi tiếng trong PopularDestinations.csv
@app.route('/api/popular-destinations', methods=['GET'])
def get_popular_destinations():
    try:
        csv_path = os.path.join(os.path.dirname(__file__), '../public/data/PopularDestinations.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({"error": "File not found", "path": csv_path}), 404
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            destinations = []
            for row in reader:
                if not row.get('id') or not row.get('Tên địa điểm'):
                    continue
                
                destinations.append({
                    'id': row['id'],
                    'title': row['Tên địa điểm'],
                    'description': row.get('Mô tả', ''),
                    'location': row.get('Tỉnh thành', ''),
                    'category': row.get('Thể loại', ''),
                    'image': row.get('ID Ảnh URL địa điểm', ''),
                    'map_link': row.get('Link google map', '')
                })
            
            return jsonify(destinations)
            
    except Exception as e:
        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500

# Đăng nhập
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        csv_path = os.path.join(os.path.dirname(__file__), '../public/data/users.csv')
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('email') == email and row.get('password') == password:
                    return jsonify({
                        "success": True,
                        "user": {
                            "id": row.get('id'),  # <-- Đảm bảo trả về đúng id
                            "name": row.get('name'),
                            "email": row.get('email')
                        }
                    })
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lấy thông tin địa điểm du lịch trong UserProfile
@app.route('/api/user-history/<user_id>', methods=['GET']) 
def get_user_history(user_id):
    try:
        # Kiểm tra file tồn tại
        if not os.path.exists(TRAVEL_HISTORY_CSV) or not os.path.exists(INFO_TRIP_CSV):
            return jsonify([])

        # Đọc dữ liệu địa điểm: map từ id -> thông tin địa điểm
        place_map = {}
        with open(INFO_TRIP_CSV, 'r', encoding='utf-8') as f_places:
            reader = csv.DictReader(f_places)
            for row in reader:
                place_map[row['id']] = row

        # Đọc lịch sử du lịch
        history = []
        with open(TRAVEL_HISTORY_CSV, 'r', encoding='utf-8') as f_history:
            reader = csv.DictReader(f_history)
            for row in reader:
                if row.get('user_id') == user_id:
                    place_id = row.get('place_id')
                    place_info = place_map.get(place_id, {})

                    history.append({
                        'id': row.get('id'),
                        'user_id': user_id,
                        'place_id': place_id,
                        'startDate': row.get('startDate'),
                        'endDate': row.get('endDate'),
                        'created_at': row.get('created_at'),
                        'placeImg': place_info.get('ID Ảnh URL địa điểm', ''),
                        'placeName': place_info.get('Tên địa điểm', ''),
                        'location': place_info.get('Tỉnh thành', ''),
                        'category': place_info.get('Thể loại', '')
                    })

        # Sắp xếp theo startDate tăng dần
        def parse_date_safe(d):
            try:
                return datetime.fromisoformat(d)
            except:
                return datetime.min

        history.sort(key=lambda x: parse_date_safe(x.get('startDate', '')), reverse=True)

        return jsonify(history)

    except Exception as e:
        print("Lỗi:", str(e))
        return jsonify({"error": str(e)}), 500

# Gợi ý trong UserProfile
@app.route('/api/suggest/user', methods=['POST'])
def suggestUser():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        df = pd.read_csv(TRAVEL_HISTORY_CSV)
        df['place_id'] = pd.to_numeric(df['place_id'], errors='coerce')
        df = df.dropna(subset=['place_id'])
        df['place_id'] = df['place_id'].astype(int)

        visited_ids = df[df['user_id'] == user_id]['place_id'].unique().tolist()

        if not visited_ids:
            return jsonify([])

        script_path = os.path.join(BASE_DIR, 'contentbase.py')
        args = [sys.executable, script_path] + list(map(str, visited_ids)) + [str(user_id)]

        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=False,
            encoding='utf-8',
            errors='replace',
            check=True
        )
        
        # Xử lý kết quả JSON
        try:
            result_data = json.loads(result.stdout)
            return jsonify(result_data)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid response from recommendation engine"}), 500

    except Exception as e:
        print(f"❌ [ERROR] Failed suggesting for user {user_id}: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500

# Xóa địa điểm đã du lịch trong UserProfile
@app.route('/api/delete-user-place/<history_id>', methods=['DELETE'])
def delete_user_place(history_id):
    try:
        history_path = os.path.join(os.path.dirname(__file__), '../public/data/user_travel_history.csv')

        if not os.path.exists(history_path):
            return jsonify({"error": "Lịch sử không tồn tại"}), 404

        with open(history_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            fieldnames = reader.fieldnames

        print("Request delete history_id:", history_id)
        print("All IDs in CSV:", [row['id'] for row in rows])

        new_rows = [row for row in rows if row['id'] != history_id]

        if len(new_rows) < len(rows):
            with open(history_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(new_rows)
            return jsonify({"success": True, "message": "Xóa địa điểm thành công"}), 200
        else:
            return jsonify({"error": "Không tìm thấy địa điểm với ID đã cho"}), 404

    except Exception as e:
        print("Lỗi:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/save-ground-truth', methods=['POST'])
def save_ground_truth():
    try:
        data = request.json
        user_id = data.get('user_id')
        source_place_id = data.get('source_place_id')
        clicked_place_id = str(data.get('clicked_place_ids'))
        timestamp = data.get('timestamp', datetime.now().isoformat())

        if not user_id or not source_place_id or not clicked_place_id:
            return jsonify({"error": "Missing required fields"}), 400

        ground_truth_path = os.path.join(DATA_DIR, 'ground_truth.csv')
        os.makedirs(DATA_DIR, exist_ok=True)

        # Đọc dữ liệu hiện có nếu file tồn tại
        rows = []
        updated = False
        if os.path.exists(ground_truth_path):
            with open(ground_truth_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['user_id'] == user_id and row['source_place_id'] == source_place_id:
                        # Nếu clicked_place_id chưa tồn tại, thêm vào
                        existing_clicks = row['clicked_place_ids'].split('|')
                        if clicked_place_id not in existing_clicks:
                            existing_clicks.append(clicked_place_id)
                        row['clicked_place_ids'] = '|'.join(existing_clicks)
                        row['timestamp'] = timestamp
                        updated = True
                    rows.append(row)

        if not updated:
            # Thêm dòng mới nếu không có bản ghi trùng
            rows.append({
                'user_id': user_id,
                'source_place_id': source_place_id,
                'clicked_place_ids': clicked_place_id,
                'timestamp': timestamp
            })

        # Ghi lại toàn bộ file (ghi đè)
        with open(ground_truth_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['user_id', 'source_place_id', 'clicked_place_ids', 'timestamp']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in rows:
                writer.writerow(row)

        return jsonify({"success": True})
    
    except Exception as e:
        print(f"Error saving ground truth: {str(e)}", file=sys.stderr)
        return jsonify({
            "error": "Failed to save ground truth",
            "details": str(e)
        }), 500
    
@app.route('/api/user-history-ids/<user_id>', methods=['GET'])
def get_user_history_ids(user_id):
    try:
        history_path = os.path.join(os.path.dirname(__file__), '../public/data/user_travel_history.csv')

        if not os.path.exists(history_path):
            return jsonify([])

        place_ids = []
        with open(history_path, 'r', encoding='utf-8') as f_history:
            reader = csv.DictReader(f_history)
            for row in reader:
                if row.get('user_id') == user_id:
                    place_id = row.get('place_id')
                    if place_id:
                        place_ids.append({ 'placeId': place_id })

        return jsonify(place_ids)

    except Exception as e:
        return jsonify({ "error": str(e) }), 500

# Lấy 5 địa điểm trong PopularDestinations.csv
@app.route('/api/popular-places', methods=['GET'])
def get_popular_places():
    try:
        csv_path = os.path.join(os.path.dirname(__file__), '../public/data/PopularDestinations.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({"error": "File not found"}), 404
            
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            all_places = list(reader)
            
            # Lấy ngẫu nhiên 5 địa điểm
            random_places = random.sample(all_places, min(5, len(all_places)))
            
            # Format dữ liệu trả về
            result = []
            for place in random_places:
                result.append({
                    'id': place.get('id'),
                    'title': place.get('Tên địa điểm'),
                    'description': place.get('Mô tả'),
                    'location': place.get('Tỉnh thành'),
                    'category': place.get('Thể loại'),
                    'image': place.get('ID Ảnh URL địa điểm'),
                    'map_link': place.get('Link google map')
                })
            
            return jsonify(result)
            
    except Exception as e:
        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)