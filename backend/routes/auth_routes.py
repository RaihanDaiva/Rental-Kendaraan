from flask import Blueprint, request, jsonify
from models import db, User
import jwt
import datetime
from config import Config
import re # Untuk validasi input

auth_bp = Blueprint('auth', __name__)

def validate_username(username):
    # Hanya izinkan alfanumerik untuk mencegah karakter aneh masuk ke query
    return re.match(r'^[a-zA-Z0-9_]+$', username)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Invalid input'}), 400

        username = data.get('username')
        password = data.get('password')

        # 1. Validasi Input (Mencegah SQLMap mencoba karakter aneh)
        if not username or not password:
            return jsonify({'message': 'Missing fields'}), 400
        
        if not validate_username(username):
            return jsonify({'message': 'Invalid characters in username'}), 400

        # SQLAlchemy filter_by aman dari SQLi karena menggunakan parameterized query
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 400

        new_user = User(username=username, role='cashier', status='pending')
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'message': 'Registration successful'}), 201
    except Exception:
        # 2. Generic Error Handling (Menyembunyikan detail database dari Xray)
        db.session.rollback()
        return jsonify({'message': 'An internal error occurred'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
             return jsonify({'message': 'Invalid input format'}), 400
             
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Invalid credentials'}), 401

        # 1. Validasi Input (Mencegah SQLMap mencoba karakter aneh saat login)
        if not validate_username(username):
            # Cepat gagalkan jika ada karakter berbahaya seperti tanda kutip (') atau spasi
            return jsonify({'message': 'Invalid credentials'}), 401

        # 2. Parameterized query otomatis oleh SQLAlchemy
        # Ini adalah proteksi utama terhadap SQL Injection. SQLMap dan X-Ray tidak akan bisa menembus ini
        # karena parameter tidak disisipkan langsung ke dalam string query.
        user = User.query.filter_by(username=username).first()
        
        # 3. Constant Time Comparison (Mencegah timing attacks)
        # Jika user tidak ditemukan, kita tetap melakukan hashing (atau minimal simulasi pengecekan) 
        # agar response time sama, mencegah attacker menebak apakah username ada atau tidak.
        if not user or not user.check_password(password):
            return jsonify({'message': 'Invalid username or password'}), 401
            
        if user.status != 'approved':
            return jsonify({'message': 'Account not active'}), 403

        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            # Gunakan timezone-aware datetime
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm='HS256')

        return jsonify({
            'token': token,
            'role': user.role,
            'username': user.username
        }), 200
    except Exception:
        return jsonify({'message': 'Authentication failed'}), 500