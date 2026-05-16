from flask import Blueprint, request, jsonify
from models import db, Partner, PksContract, Vehicle
from datetime import datetime
import uuid

partner_bp = Blueprint('partner', __name__)

@partner_bp.route('', methods=['GET'])
def get_partners():
    partners = Partner.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'nik': p.nik,
        'address': p.address,
        'phone': p.phone,
        'bank_account': p.bank_account
    } for p in partners]), 200

@partner_bp.route('', methods=['POST'])
def create_partner():
    data = request.json
    try:
        new_partner = Partner(
            name=data['name'],
            nik=data['nik'],
            address=data['address'],
            phone=data['phone'],
            bank_account=data['bank_account']
        )
        db.session.add(new_partner)
        db.session.commit()
        return jsonify({'message': 'Mitra berhasil ditambahkan', 'id': new_partner.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@partner_bp.route('/contracts', methods=['GET'])
def get_contracts():
    contracts = db.session.query(
        PksContract, Partner, Vehicle
    ).join(Partner, PksContract.partner_id == Partner.id)\
     .join(Vehicle, PksContract.vehicle_id == Vehicle.id).all()
    
    return jsonify([{
        'id': c.id,
        'contract_number': c.contract_number,
        'partner_name': p.name,
        'vehicle_name': v.brand_model,
        'plate_number': v.plate_number,
        'start_date': c.start_date.isoformat(),
        'end_date': c.end_date.isoformat(),
        'profit_share_partner': c.profit_share_partner,
        'status': c.status
    } for c, p, v in contracts]), 200

@partner_bp.route('/contracts', methods=['POST'])
def create_contract():
    data = request.json
    try:
        # 1. Register Vehicle
        new_vehicle = Vehicle(
            plate_number=data['plate_number'],
            brand_model=data['brand_model'],
            vehicle_type=data['vehicle_type'],
            daily_rate=data['daily_rate'],
            image_url=data.get('image_url'),
            partner_id=data['partner_id'],
            status='available'
        )
        db.session.add(new_vehicle)
        db.session.flush() # Get the new_vehicle.id without committing

        # 2. Create Contract
        contract_num = f"PKS-{uuid.uuid4().hex[:6].upper()}"
        new_contract = PksContract(
            contract_number=contract_num,
            partner_id=data['partner_id'],
            vehicle_id=new_vehicle.id,
            start_date=data['start_date'],
            end_date=data['end_date'],
            profit_share_partner=data['profit_share_partner']
        )
        db.session.add(new_contract)
        db.session.commit()
        
        return jsonify({
            'message': 'Kontrak dan Kendaraan berhasil ditambahkan', 
            'contract_number': contract_num
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
