from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'owner', 'cashier'
    status = db.Column(db.String(20), default='pending') # 'pending', 'approved', 'rejected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(20), unique=True, nullable=False)
    brand_model = db.Column(db.String(100), nullable=False)
    vehicle_type = db.Column(db.String(20), nullable=False) # 'car', 'motorcycle'
    status = db.Column(db.String(20), default='available')
    daily_rate = db.Column(db.Numeric(10, 2), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), unique=True, nullable=False)
    
    cashier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    customer_id = db.Column(db.Integer, nullable=True) # Assuming no customers table in models for now
    
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    vehicle_name = db.Column(db.String(100), nullable=False)
    
    # Contract Fields
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    
    # Return & Penalty
    actual_return_date = db.Column(db.Date, nullable=True)
    penalty_amount = db.Column(db.Numeric(12, 2), default=0)
    trx_status = db.Column(db.String(20), default='active') # 'active' (sedang disewa), 'completed' (sudah kembali)
    
    payment_type = db.Column(db.String(50), nullable=False)
    payment_status = db.Column(db.String(20), default='pending')
    snap_token = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

