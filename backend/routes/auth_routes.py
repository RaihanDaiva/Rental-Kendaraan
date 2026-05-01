from flask import Blueprint, request, jsonify
from models import db, User
import jwt
from config import Config
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    new_user = User(username=username, role='cashier', status='pending')
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Registration successful. Waiting for admin approval.'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid username or password'}), 401
        
    if user.status != 'approved':
        return jsonify({'message': 'Your account is pending admin approval'}), 403

    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, Config.SECRET_KEY, algorithm='HS256')

    return jsonify({
        'token': token,
        'role': user.role,
        'username': user.username,
        'user_id': user.id
    }), 200
