from flask import Blueprint, request, jsonify
from models import db, Transaction, Vehicle
import midtransclient
from config import Config
import uuid
import datetime
import os
import requests
import base64
import re
import tempfile
from inference_sdk import InferenceHTTPClient
import sys
import os
# Tambahkan path lokal untuk import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# Karena file pos_routes.py ada di folder routes, sedangkan money_verifier.py ada di backend
# kita harus import dengan benar
try:
    from money_verifier import verify_money_authenticity
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from money_verifier import verify_money_authenticity

pos_bp = Blueprint('pos', __name__)

# Inisialisasi Midtrans Snap Client
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
        
        payment_type = data.get('paymentType', 'digital')
        cashier_id_raw = data.get('cashierId')
        cashier_id = int(cashier_id_raw) if cashier_id_raw else None
        
        snap_token = None
        payment_status = 'pending'
        
        # Pisahkan logika Digital (Midtrans) dan Cash
        if payment_type == 'digital':
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
                }]
            }
            transaction = snap.create_transaction(param)
            snap_token = transaction['token']
            payment_status = 'pending' 
            
        elif payment_type == 'cash':
            # Pembayaran tunai diverifikasi langsung oleh kasir, status sukses
            snap_token = None
            payment_status = 'success' 

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
            payment_type=payment_type,
            payment_status=payment_status,
            trx_status='active',
            snap_token=snap_token
        )
        db.session.add(new_trx)
        
        # Jika transaksi cash, ubah status kendaraan menjadi rented
        if payment_type == 'cash' and payment_status == 'success':
            vehicle = Vehicle.query.get(data['vehicleId'])
            if vehicle:
                vehicle.status = 'rented'
                
        db.session.commit()
        
        return jsonify({'status': 'success', 'order_id': order_id, 'token': snap_token, 'payment_type': payment_type}), 200
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

@pos_bp.route('/transactions/<int:id>/return', methods=['POST'])
def return_vehicle(id):
    try:
        data = request.json
        actual_return_date = datetime.datetime.strptime(data['actualReturnDate'], '%Y-%m-%d').date()
        
        trx = Transaction.query.get(id)
        if not trx:
            return jsonify({'message': 'Transaction not found'}), 404
            
        # Logic Denda: Rp 50.000 per hari keterlambatan
        overdue_days = (actual_return_date - trx.end_date).days
        penalty = 0
        if overdue_days > 0:
            penalty = overdue_days * 50000 
            
        trx.actual_return_date = actual_return_date
        trx.penalty_amount = penalty
        trx.trx_status = 'completed'
        
        # Kembalikan status kendaraan menjadi available
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

# Endpoint Deteksi Uang Kertas via Roboflow API
@pos_bp.route('/detect-cash', methods=['POST'])
def detect_cash():
    if 'image' not in request.files:
        return jsonify({'is_real': False, 'message': 'Tidak ada gambar yang diunggah.'}), 400

    file = request.files['image']
    
    try:
        # Simpan file sementara untuk dibaca oleh inference_sdk
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            temp.write(file.read())
            temp_path = temp.name

        try:
            # Menggunakan InferenceHTTPClient dari Roboflow
            api_key = os.getenv('ROBOFLOW_API_KEY', 'K9sqAyRfkXUgwRXDpbSY')
            CLIENT = InferenceHTTPClient(
                api_url="https://serverless.roboflow.com",
                api_key=api_key
            )
            
            # =========================================================================
            # BUKTI PENGGUNAAN 2 MODEL
            # =========================================================================
            
            # 1. URL Model AI untuk Deteksi Nominal Uang
            # Full URL Endpoint: https://serverless.roboflow.com/deteksi-mata-uang-rupiah-nerog/2
            URL_MODEL_NOMINAL = "deteksi-mata-uang-rupiah-nerog/2"
            
            # 2. URL Model AI untuk Deteksi Uang Palsu/Asli (Pendeteksi Watermark)
            # Full URL Endpoint: https://serverless.roboflow.com/deteksi-uang-palsu-ofbpj/6
            URL_MODEL_WATERMARK = "deteksi-uang-palsu-ofbpj/6"
            
            # =========================================================================

            # Lakukan inferensi untuk mengecek nominal uang
            result = CLIENT.infer(temp_path, model_id=URL_MODEL_NOMINAL)
            
            # Lakukan inferensi khusus untuk mengecek keberadaan Watermark (Asli/Palsu)
            result_fake = CLIENT.infer(temp_path, model_id=URL_MODEL_WATERMARK)
            fake_predictions = result_fake.get('predictions', [])
            
            # =========================================================================
            # TINGKAT AKURASI (CONFIDENCE THRESHOLD) UNTUK UANG ASLI/PALSU
            # =========================================================================
            # Set persentase minimal model harus yakin bahwa watermark itu ada.
            # 0.60 berarti 60%. Jika model mendeteksi watermark tapi akurasinya cuma 40%, 
            # maka uang tetap dianggap PALSU.
            MIN_WATERMARK_CONFIDENCE = 0.60 
            
            has_watermark = False
            for fp in fake_predictions:
                conf = fp.get('confidence', 0)
                if conf >= MIN_WATERMARK_CONFIDENCE:
                    has_watermark = True
                    break
            
            predictions = result.get('predictions', [])
            
            # Fungsi menghitung persentase tumpang tindih (Intersection over Union / IoU)
            def calculate_iou(box1, box2):
                x1, y1, w1, h1 = box1.get('x', 0), box1.get('y', 0), box1.get('width', 0), box1.get('height', 0)
                x2, y2, w2, h2 = box2.get('x', 0), box2.get('y', 0), box2.get('width', 0), box2.get('height', 0)
                
                # Asumsi format x, y adalah titik tengah (center) dari kotak model Roboflow
                xmin1, ymin1, xmax1, ymax1 = x1 - w1/2, y1 - h1/2, x1 + w1/2, y1 + h1/2
                xmin2, ymin2, xmax2, ymax2 = x2 - w2/2, y2 - h2/2, x2 + w2/2, y2 + h2/2
                
                ixmin, iymin = max(xmin1, xmin2), max(ymin1, ymin2)
                ixmax, iymax = min(xmax1, xmax2), min(ymax1, ymax2)
                
                intersection = max(ixmax - ixmin, 0) * max(iymax - iymin, 0)
                union = (w1 * h1) + (w2 * h2) - intersection
                
                return intersection / union if union > 0 else 0

            # 1. Turunkan threshold agar objek yang samar tetap dapat terdeteksi (Threshold: 0.15)
            # Semakin rendah nilainya, semakin sensitif model mendeteksi objek.
            filtered_preds = [p for p in predictions if p.get('confidence', 1.0) >= 0.15]
            
            # 2. Urutkan berdasarkan tingkat keyakinan (confidence) tertinggi
            filtered_preds = sorted(filtered_preds, key=lambda x: x.get('confidence', 0), reverse=True)
            
            # 3. Terapkan algoritma NMS untuk menghapus deteksi ganda pada lokasi yang sama
            valid_predictions = []
            for p in filtered_preds:
                overlap = False
                for vp in valid_predictions:
                    # Toleransi tumpang tindih dinaikkan ke 65% (0.65). 
                    # Jika ada 2 uang yang tertumpuk (misal setengah bagiannya menutupi uang lain), 
                    # mereka tetap dihitung sebagai 2 uang yang berbeda.
                    if calculate_iou(p, vp) > 0.65:  
                        overlap = True
                        break
                if not overlap:
                    valid_predictions.append(p)

            if not valid_predictions:
                return jsonify({'is_real': False, 'message': 'Tidak ada objek uang terdeteksi dengan yakin.'}), 200

            total_nominal = 0
            # Keaslian default ditentukan oleh ada tidaknya watermark dari model khusus
            is_real = has_watermark 
            detected_classes = []

            for pred in valid_predictions:
                class_raw = pred.get('class', '').upper()
                detected_classes.append(class_raw)
                
                # Pengecekan validasi keaslian (dari model AI)
                if 'PALSU' in class_raw or 'FAKE' in class_raw:
                    is_real = False

                # Pengecekan validasi keaslian dengan Pengolahan Citra (OpenCV)
                bbox = (pred.get('x'), pred.get('y'), pred.get('width'), pred.get('height'))
                if all(b is not None for b in bbox):
                    cv2_is_real, cv2_reason = verify_money_authenticity(temp_path, bbox)
                    if not cv2_is_real:
                        is_real = False
                        # Bisa cetak log alasan OpenCV
                        print(f"OpenCV: {cv2_reason}")

                # Hapus titik dan koma terlebih dahulu agar 100.000 terbaca 100000
                clean_class = class_raw.replace('.', '').replace(',', '').replace(' ', '')
                
                # Coba cari angka
                match = re.search(r'(\d+)', clean_class)
                if match:
                    val = int(match.group(1))
                    # Jika model mendeteksi angka kecil seperti "100" atau "50" untuk nominal ribuan
                    if val <= 1000 and val > 0:
                        val *= 1000
                    total_nominal += val
                else:
                    # Fallback tambahan jika nama kelas menggunakan huruf (teks) 
                    # Diperluas dengan penulisan tanpa spasi dan angka
                    if 'SERATUS' in class_raw or '100K' in class_raw or '100RB' in class_raw: total_nominal += 100000
                    elif 'TUJUH PULUH LIMA' in class_raw or '75K' in class_raw or '75RB' in class_raw: total_nominal += 75000
                    elif 'LIMA PULUH' in class_raw or '50K' in class_raw or '50RB' in class_raw or 'LIMAPULUH' in class_raw: total_nominal += 50000
                    elif 'DUA PULUH' in class_raw or '20K' in class_raw or '20RB' in class_raw or 'DUAPULUH' in class_raw: total_nominal += 20000
                    elif 'SEPULUH' in class_raw or '10K' in class_raw or '10RB' in class_raw: total_nominal += 10000
                    elif 'LIMA RIBU' in class_raw or '5K' in class_raw or '5RB' in class_raw or 'LIMARIBU' in class_raw: total_nominal += 5000
                    elif 'DUA RIBU' in class_raw or '2K' in class_raw or '2RB' in class_raw or 'DUARIBU' in class_raw: total_nominal += 2000
                    elif 'SERIBU' in class_raw or 'SATU RIBU' in class_raw or '1K' in class_raw or '1RB' in class_raw: total_nominal += 1000

            status = 'SEMUA ASLI' if is_real else 'TERDAPAT UANG PALSU'
            message = f"Total Nominal: {total_nominal} ({status} - {len(valid_predictions)} lembar)"
            
            return jsonify({
                'is_real': is_real,
                'message': message,
                'nominal_raw': str(total_nominal),
                'raw_class': ", ".join(detected_classes),
                'total_objects': len(valid_predictions)
            }), 200

        finally:
            # Hapus file sementara setelah selesai
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        return jsonify({'is_real': False, 'message': f'Terjadi kesalahan server: {str(e)}'}), 500