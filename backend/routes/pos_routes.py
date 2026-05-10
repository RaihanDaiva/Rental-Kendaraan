from flask import Blueprint, request, jsonify
from models import db, Transaction, Vehicle
import midtransclient
from config import Config
import uuid
import datetime

pos_bp = Blueprint('pos', __name__)

snap = midtransclient.Snap(
    is_production=Config.MIDTRANS_IS_PRODUCTION,
    server_key=Config.MIDTRANS_SERVER_KEY
)

@pos_bp.route('/vehicles/available', methods=['GET'])
def get_available_vehicles():
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if not start_date_str or not end_date_str:
            return jsonify({'message': 'start_date and end_date are required'}), 400
            
        # Cari vehicle_id yang jadwal sewanya bentrok (overlap)
        overlapping_trx = db.session.query(Transaction.vehicle_id).filter(
            Transaction.trx_status == 'active',  # Hanya hitung yang masih disewa/aktif
            Transaction.start_date <= end_date_str,
            Transaction.end_date >= start_date_str
        ).subquery()
        
        # Ambil kendaraan yang tidak maintenance dan tidak ada di subquery overlapping
        available_vehicles = db.session.query(Vehicle).filter(
            Vehicle.status != 'maintenance',
            ~Vehicle.id.in_(overlapping_trx)
        ).all()
        
        return jsonify([{
            'id': v.id,
            'plate_number': v.plate_number,
            'brand_model': v.brand_model,
            'vehicle_type': v.vehicle_type,
            'status': v.status,
            'daily_rate': float(v.daily_rate),
            'image_url': v.image_url
        } for v in available_vehicles]), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@pos_bp.route('/transactions/charge', methods=['POST'])
def charge_transaction():
    try:
        data = request.json
        order_id = f"TRX-{uuid.uuid4().hex[:8].upper()}"
        gross_amount = int(data['totalAmount'])
        
        # Parse dates
        start_date = datetime.datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(data['endDate'], '%Y-%m-%d').date()
        
        param = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": gross_amount
            },
            "customer_details": {
                "first_name": data['customerName'],
                "phone": data['customerPhone']
            },
            "item_details": [{
                "id": data['vehicleId'],
                "price": data['dailyRate'],
                "quantity": data['totalDays'],
                "name": data['vehicleName']
            }],
            "enabled_payments": [
                "bca_va", "bni_va", "bri_va", "cimb_va", "other_va", 
                "gopay", "shopeepay", "qris", "echannel", 
            ]
        }
        
        transaction = snap.create_transaction(param)
        snap_token = transaction['token']
        
        
        cashier_id_raw = data.get('cashierId')
        cashier_id = int(cashier_id_raw) if cashier_id_raw else None
        
        new_trx = Transaction(
            order_id=order_id,
            cashier_id=cashier_id,
            customer_name=data['customerName'],
            customer_phone=data['customerPhone'],
            vehicle_id=data['vehicleId'],
            vehicle_name=data['vehicleName'],
            start_date=start_date,
            end_date=end_date,
            total_days=data['totalDays'],
            total_amount=gross_amount,
            payment_type='digital',
            payment_status='pending',
            trx_status='active',
            snap_token=snap_token
        )
        db.session.add(new_trx)
        db.session.commit()
        
        return jsonify({'status': 'success', 'order_id': order_id, 'token': snap_token}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@pos_bp.route('/transactions/<order_id>/success', methods=['POST'])
def transaction_success(order_id):
    try:
        trx = Transaction.query.filter_by(order_id=order_id).first()
        if not trx:
            return jsonify({'status': 'not found'}), 404
            
        trx.payment_status = 'success'
        vehicle = Vehicle.query.get(trx.vehicle_id)
        if vehicle:
            vehicle.status = 'rented'
            
        db.session.commit()
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@pos_bp.route('/webhook/midtrans', methods=['POST'])
def midtrans_webhook():
    try:
        notification = request.json
        order_id = notification.get('order_id')
        transaction_status = notification.get('transaction_status')
        fraud_status = notification.get('fraud_status')
        
        trx = Transaction.query.filter_by(order_id=order_id).first()
        if not trx:
            return jsonify({'status': 'not found'}), 404
            
        success = False
        if transaction_status == 'capture':
            if fraud_status == 'accept':
                success = True
        elif transaction_status == 'settlement':
            success = True
            
        if success:
            trx.payment_status = 'success'
            # Update Vehicle state to rented!
            vehicle = Vehicle.query.get(trx.vehicle_id)
            if vehicle:
                vehicle.status = 'rented'
        elif transaction_status in ['cancel', 'deny', 'expire']:
            trx.payment_status = 'failed'
            
        db.session.commit()
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error'}), 500

# Endpoint to get transaction by order_id
@pos_bp.route('/transactions/<order_id>', methods=['GET'])
def get_transaction(order_id):
    trx = Transaction.query.filter_by(order_id=order_id).first()
    if not trx:
        return jsonify({'message': 'Transaction not found'}), 404
        
    return jsonify({
        'id': trx.id,
        'order_id': trx.order_id,
        'customer_name': trx.customer_name,
        'customer_phone': trx.customer_phone,
        'vehicle_id': trx.vehicle_id,
        'vehicle_name': trx.vehicle_name,
        'start_date': trx.start_date.isoformat() if trx.start_date else None,
        'end_date': trx.end_date.isoformat() if trx.end_date else None,
        'total_days': trx.total_days,
        'total_amount': float(trx.total_amount),
        'payment_type': trx.payment_type,
        'payment_status': trx.payment_status,
        'trx_status': trx.trx_status,
        'created_at': trx.created_at.isoformat() if trx.created_at else None
    }), 200

# Endpoint to fetch active rentals
@pos_bp.route('/transactions/active', methods=['GET'])
def get_active_transactions():
    active_trx = Transaction.query.filter_by(trx_status='active', payment_status='success').all()
    return jsonify([{
        'id': t.id,
        'order_id': t.order_id,
        'customer_name': t.customer_name,
        'vehicle_name': t.vehicle_name,
        'start_date': t.start_date.isoformat(),
        'end_date': t.end_date.isoformat(),
        'total_amount': float(t.total_amount)
    } for t in active_trx]), 200

# Endpoint for returning vehicle and calculating penalty
@pos_bp.route('/transactions/<int:id>/return', methods=['POST'])
def return_vehicle(id):
    try:
        data = request.json
        actual_return_date = datetime.datetime.strptime(data['actualReturnDate'], '%Y-%m-%d').date()
        
        trx = Transaction.query.get(id)
        if not trx:
            return jsonify({'message': 'Transaction not found'}), 404
            
        # Logic Denda: Misal Rp 50.000 per hari keterlambatan
        overdue_days = (actual_return_date - trx.end_date).days
        penalty = 0
        if overdue_days > 0:
            penalty = overdue_days * 50000 # 50k per day
            
        trx.actual_return_date = actual_return_date
        trx.penalty_amount = penalty
        trx.trx_status = 'completed'
        
        # Vehicle status back to available
        vehicle = Vehicle.query.get(trx.vehicle_id)
        if vehicle:
            vehicle.status = 'available'
            
        db.session.commit()
        
        return jsonify({
            'message': 'Kendaraan berhasil dikembalikan',
            'overdue_days': overdue_days if overdue_days > 0 else 0,
            'penalty_amount': penalty
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
