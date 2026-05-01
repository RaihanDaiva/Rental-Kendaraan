from flask import Blueprint, request, jsonify
from models import db, User, Vehicle, Transaction

admin_bp = Blueprint('admin', __name__)

# Note: In real app, all these endpoints should be protected by JWT and role='owner' middleware.
# For demo, we leave it simple but recommend adding JWT middleware.

@admin_bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    total_vehicles = Vehicle.query.count()
    total_transactions = Transaction.query.count()
    total_revenue = db.session.query(db.func.sum(Transaction.total_amount)).filter(Transaction.payment_status == 'success').scalar() or 0
    pending_accounts = User.query.filter_by(status='pending').count()

    return jsonify({
        'totalVehicles': total_vehicles,
        'totalTransactions': total_transactions,
        'totalRevenue': float(total_revenue),
        'pendingAccounts': pending_accounts
    }), 200

@admin_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'role': u.role,
        'status': u.status
    } for u in users]), 200

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
def approve_user(user_id):
    user = User.query.get(user_id)
    if user:
        user.status = 'approved'
        db.session.commit()
        return jsonify({'message': 'User approved successfully'}), 200
    return jsonify({'message': 'User not found'}), 404

@admin_bp.route('/vehicles', methods=['GET'])
def get_vehicles():
    vehicles = Vehicle.query.all()
    return jsonify([{
        'id': v.id,
        'plate_number': v.plate_number,
        'brand_model': v.brand_model,
        'vehicle_type': v.vehicle_type,
        'status': v.status,
        'daily_rate': float(v.daily_rate),
        'image_url': v.image_url
    } for v in vehicles]), 200

@admin_bp.route('/vehicles', methods=['POST'])
def add_vehicle():
    data = request.json
    new_vehicle = Vehicle(
        plate_number=data.get('plate_number'),
        brand_model=data.get('brand_model'),
        vehicle_type=data.get('vehicle_type'),
        daily_rate=data.get('daily_rate'),
        image_url=data.get('image_url')
    )
    db.session.add(new_vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle added successfully'}), 201
@admin_bp.route('/vehicles/<int:id>', methods=['PUT'])
def update_vehicle(id):
    vehicle = Vehicle.query.get(id)
    if not vehicle:
        return jsonify({'message': 'Not found'}), 404
    data = request.json
    vehicle.plate_number = data.get('plate_number', vehicle.plate_number)
    vehicle.brand_model = data.get('brand_model', vehicle.brand_model)
    vehicle.vehicle_type = data.get('vehicle_type', vehicle.vehicle_type)
    vehicle.daily_rate = data.get('daily_rate', vehicle.daily_rate)
    vehicle.image_url = data.get('image_url', vehicle.image_url)
    vehicle.status = data.get('status', vehicle.status)
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@admin_bp.route('/vehicles/<int:id>', methods=['DELETE'])
def delete_vehicle(id):
    vehicle = Vehicle.query.get(id)
    if not vehicle:
        return jsonify({'message': 'Not found'}), 404
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@admin_bp.route('/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()
    return jsonify([{
        'id': t.id,
        'order_id': t.order_id,
        'customer_name': t.customer_name,
        'vehicle_name': t.vehicle_name,
        'total_amount': float(t.total_amount),
        'payment_status': t.payment_status,
        'trx_status': t.trx_status,
        'created_at': t.created_at.isoformat()
    } for t in transactions]), 200

@admin_bp.route('/dashboard/chart', methods=['GET'])
def get_dashboard_chart():
    # Simple chart data: total revenue per payment status or just a mock trend
    # We will aggregate by date. Since SQLite/MySQL diff, we will do it in python for simplicity
    transactions = Transaction.query.filter_by(payment_status='success').order_by(Transaction.created_at).all()
    
    chart_data = {}
    for t in transactions:
        date_str = t.created_at.strftime('%Y-%m-%d')
        if date_str not in chart_data:
            chart_data[date_str] = 0
        chart_data[date_str] += float(t.total_amount)
        
    # Format for recharts: [{name: '2023-01-01', revenue: 500000}, ...]
    result = [{'name': k, 'revenue': v} for k, v in chart_data.items()]
    
    # If empty, provide mock data so the chart isn't totally blank on fresh install
    if not result:
        import datetime
        today = datetime.date.today()
        result = [
            {'name': (today - datetime.timedelta(days=2)).strftime('%Y-%m-%d'), 'revenue': 0},
            {'name': (today - datetime.timedelta(days=1)).strftime('%Y-%m-%d'), 'revenue': 0},
            {'name': today.strftime('%Y-%m-%d'), 'revenue': 0}
        ]
        
    return jsonify(result), 200
