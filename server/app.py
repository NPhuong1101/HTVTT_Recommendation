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

# Đường dẫn đến file CSV
USERS_CSV = 'data/users.csv'
TRAVEL_HISTORY_CSV = 'data/user_travel_history.csv'

app = Flask(__name__)
CORS(app)  # Bật CORS cho tất cả routes

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

@app.route('/api/suggest', methods=['POST'])
def suggest():
    data = request.get_json()
    place_id = data.get('id', '')

    try:
        script_path = os.path.join(os.path.dirname(__file__), 'contentbase.py')
        result = subprocess.run(
            [sys.executable, script_path, str(place_id)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True,
            encoding='utf-8',
            errors='replace',
            check=True
        )
        print(f"[DEBUG] Suggestion result: {result.stdout}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ [ERROR] subprocess failed: {e.stderr}")
        return jsonify([])

@app.route('/get-csv')
def get_csv():
    return send_from_directory('../public/data', 'Info-trip.csv')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    new_email = data.get('email')
    
    if not new_email:
        return jsonify({"error": "Email là bắt buộc"}), 400

    users_csv_path = os.path.join(os.path.dirname(__file__), '../public/data/users.csv')

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

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email và mật khẩu là bắt buộc"}), 400
        
        # Đường dẫn chính xác
        csv_path = os.path.join(os.path.dirname(__file__), '../public/data/users.csv')
        if not os.path.exists(csv_path):
            return jsonify({"error": "User database not found"}), 500
            
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('email') == email and row.get('password') == password:
                    return jsonify({
                        "success": True,
                        "user": {
                            "id": row.get('id', ''),
                            "name": row.get('name', ''),
                            "email": row.get('email', '')
                        }
                    })
        
        return jsonify({"error": "Email hoặc mật khẩu không đúng"}), 401

    except Exception as e:
        import traceback
        print(f"Login error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/user-history/<user_id>', methods=['GET'])
def get_user_history(user_id):
    try:
        path = os.path.join(os.path.dirname(__file__), '../public/data/user_travel_history.csv')
        if not os.path.exists(path):
            return jsonify([])

        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            history = [
                row for row in reader
                if row.get('user_id') == user_id
            ]
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/suggest/user', methods=['POST'])
def suggestUser():
    data = request.get_json()
    user_id = data.get('user_id', None)

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    csv_path = os.path.join(os.path.dirname(__file__), '../public/data/user_travel_history.csv')

    try:
        df = pd.read_csv(csv_path)
        # Chuyển place_id sang số nguyên, loại bỏ giá trị không hợp lệ
        df['place_id'] = pd.to_numeric(df['place_id'], errors='coerce')
        df = df.dropna(subset=['place_id'])
        df['place_id'] = df['place_id'].astype(int)

        # Lọc các place_id người dùng đã du lịch
        visited_ids = df[df['user_id'] == user_id]['place_id'].unique().tolist()

        if not visited_ids:
            return jsonify([])

        # Truyền nhiều ID làm đối số cho contentbase.py (đã được sửa nhận list)
        script_path = os.path.join(os.path.dirname(__file__), 'contentbase.py')
        args = [sys.executable, script_path] + list(map(str, visited_ids))

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

        print(f"[DEBUG] Suggestion result for user {user_id}: {result.stdout}", file=sys.stderr)
        return result.stdout

    except Exception as e:
        print(f"❌ [ERROR] Failed suggesting for user {user_id}: {e}", file=sys.stderr)
        return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)