# Rancangan Arsitektur Sistem POS & Rental Kendaraan

Sistem ini dirancang dengan memisahkan antara frontend (React.js) dan backend (Flask Python), berkomunikasi via RESTful API. Desain ini memastikan keamanan data pelanggan dan kemudahan integrasi dengan pihak ketiga (Midtrans).

---

## 1. Keamanan Sistem (Strict Security)

Keamanan adalah prioritas utama, terutama karena aplikasi menyimpan data sensitif seperti KTP dan password.

1.  **Password Hashing**: Menggunakan `werkzeug.security` (bcrypt/scrypt) di Flask untuk menghash password sebelum disimpan ke database.
2.  **Autentikasi (JWT)**: Menggunakan `PyJWT` atau `Flask-JWT-Extended`. Token JWT akan menyimpan `user_id` dan `role` (Owner/Cashier). Frontend harus mengirimkan token ini di *Authorization header* (`Bearer <token>`) pada setiap request API yang diproteksi.
3.  **At-Rest Encryption untuk KTP**: Menggunakan `cryptography.fernet` (Symmetric Encryption) di backend Flask sebelum data KTP dimasukkan ke MySQL, atau menggunakan fitur enkripsi bawaan MySQL (`AES_ENCRYPT` dan `AES_DECRYPT`).
4.  **Role-Based Access Control (RBAC)**: Middleware di Flask yang akan mengecek `role` dari JWT payload. Jika Cashier mencoba mengakses endpoint Owner (`/api/admin/*`), server akan menolak dengan `403 Forbidden`.

---

## 2. Struktur Database (MySQL)

Berikut adalah rancangan tabel database relasional.

### Tabel `users` (Manajemen Akun & Kasir)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `username` | VARCHAR(50) | Unique |
| `password_hash` | VARCHAR(255) | Hashed password |
| `role` | ENUM | 'owner', 'cashier' |
| `created_at` | TIMESTAMP | Default CURRENT_TIMESTAMP |

### Tabel `customers` (Data Pelanggan)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `full_name` | VARCHAR(100) | |
| `phone_number`| VARCHAR(20) | |
| `ktp_encrypted`| TEXT | Data KTP yang dienkripsi AES-256 |
| `created_at` | TIMESTAMP | |

### Tabel `vehicles` (Master Data Kendaraan)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `plate_number` | VARCHAR(20) | Unique |
| `brand_model` | VARCHAR(100) | Contoh: Honda Vario, Toyota Avanza |
| `vehicle_type`| ENUM | 'car', 'motorcycle' |
| `status` | ENUM | 'available', 'rented', 'maintenance' |
| `daily_rate` | DECIMAL(10,2)| Harga sewa per hari |

### Tabel `transactions` (Penyewaan & Pembayaran)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment |
| `order_id` | VARCHAR(50) | Unique (Digunakan untuk Midtrans) |
| `cashier_id` | INT (FK) | Mengarah ke `users.id` |
| `customer_id` | INT (FK) | Mengarah ke `customers.id` |
| `vehicle_id` | INT (FK) | Mengarah ke `vehicles.id` |
| `start_date` | DATE | Tanggal mulai sewa |
| `end_date` | DATE | Tanggal selesai sewa |
| `total_days` | INT | Durasi hari |
| `total_amount`| DECIMAL(12,2)| Total pembayaran |
| `payment_type`| VARCHAR(50) | 'midtrans', 'cash' |
| `payment_status`| ENUM | 'pending', 'success', 'failed', 'expired' |
| `created_at` | TIMESTAMP | |

---

## 3. Desain API Endpoints (Flask)

### Authentication API
- `POST /api/auth/login` - Menerima username & password, mengembalikan JWT token.

### Admin/Owner API (Membutuhkan JWT & Role: Owner)
- `GET /api/admin/dashboard` - Statistik total pendapatan, kendaraan disewa.
- `GET, POST, PUT, DELETE /api/admin/vehicles` - CRUD kendaraan.
- `GET, POST, PUT, DELETE /api/admin/users` - CRUD akun kasir.

### POS & Kasir API (Membutuhkan JWT & Role: Cashier/Owner)
- `GET /api/pos/vehicles/available` - List kendaraan yang bisa disewa.
- `POST /api/pos/customers` - Input pelanggan baru (melakukan enkripsi KTP).
- `POST /api/pos/transactions/charge` - Membuat transaksi baru & generate Midtrans Snap Token.

### Webhook/Callback API (Public, tapi divalidasi dengan Signature Key)
- `POST /api/midtrans/webhook` - Endpoint untuk menerima notifikasi status pembayaran dari Midtrans.

---

## 4. Alur Integrasi Uang Digital (Midtrans)

### A. Backend (Flask) - Generate Snap Token
Ketika kasir submit data penyewaan di halaman POS, Frontend menembak endpoint `POST /api/pos/transactions/charge`. Backend akan:
1. Menyimpan data ke tabel `transactions` dengan status `pending`.
2. Melakukan request ke API Midtrans untuk mendapatkan token.

```python
# Contoh implementasi Flask & Midtrans SDK
import midtransclient
from flask import Blueprint, request, jsonify

snap = midtransclient.Snap(
    is_production=False,
    server_key='YOUR_SERVER_KEY'
)

@pos_bp.route('/transactions/charge', methods=['POST'])
@jwt_required()
def charge_transaction():
    data = request.json
    order_id = f"TRX-{uuid.uuid4().hex[:8].upper()}"
    
    # 1. Simpan ke database (Transactions: pending)
    # ... logic DB ...

    # 2. Buat parameter untuk Midtrans
    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": data['total_amount']
        },
        "customer_details": {
            "first_name": data['customer_name'],
            "phone": data['customer_phone']
        },
        "item_details": [{
            "id": data['vehicle_id'],
            "price": data['daily_rate'],
            "quantity": data['total_days'],
            "name": data['vehicle_name']
        }]
    }

    # 3. Dapatkan Snap Token
    transaction = snap.create_transaction(param)
    transaction_token = transaction['token']
    
    return jsonify({
        "order_id": order_id,
        "token": transaction_token
    })
```

### B. Backend (Flask) - Midtrans Webhook (Callback)
Midtrans akan mengirim POST request ke backend saat user berhasil bayar.

```python
@midtrans_bp.route('/webhook', methods=['POST'])
def midtrans_notification():
    notif = request.json
    # Validasi signature key di sini untuk keamanan
    
    order_id = notif.get('order_id')
    transaction_status = notif.get('transaction_status')
    
    if transaction_status == 'capture' or transaction_status == 'settlement':
        # UPDATE tabel transactions SET payment_status = 'success'
        # UPDATE tabel vehicles SET status = 'rented'
        pass
    elif transaction_status in ['deny', 'cancel', 'expire']:
        # UPDATE tabel transactions SET payment_status = 'failed'
        pass
        
    return jsonify({"status": "ok"}), 200
```

---

## 5. Struktur Komponen React (Frontend)

Struktur folder React (`src/`):

```text
src/
├── components/
│   ├── Layout/          # Sidebar, Navbar
│   ├── PrivateRoute.jsx # Wrapper untuk cek JWT dan Role
│   └── PrintInvoice.jsx # Desain Invoice PDF khusus cetak
├── pages/
│   ├── Login.jsx
│   ├── Admin/
│   │   ├── Dashboard.jsx
│   │   └── ManageVehicles.jsx
│   └── Cashier/
│       ├── POSPage.jsx  # Halaman utama Kasir
│       └── Invoice.jsx  # Halaman setelah bayar sukses
├── services/
│   └── api.js           # Konfigurasi Axios & JWT Interceptors
└── utils/
    └── auth.js          # Logic untuk parse JWT & hapus token
```

### Contoh Integrasi Midtrans di React (POSPage.jsx)

Pada Frontend, masukkan script Midtrans Snap di `index.html`:
`<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="YOUR_CLIENT_KEY"></script>`

```jsx
import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function POSPage() {
  const [cart, setCart] = useState(null);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      // 1. Panggil API Flask untuk buat transaksi & minta Token Midtrans
      const response = await api.post('/api/pos/transactions/charge', cart);
      const snapToken = response.data.token;

      // 2. Buka Popup Midtrans
      window.snap.pay(snapToken, {
        onSuccess: function(result){
          // Pembayaran berhasil
          alert("Pembayaran Berhasil!");
          navigate(`/cashier/invoice/${result.order_id}`);
        },
        onPending: function(result){
          alert("Menunggu pembayaran!");
        },
        onError: function(result){
          alert("Pembayaran gagal!");
        },
        onClose: function(){
          alert("Anda menutup popup sebelum menyelesaikan pembayaran");
        }
      });
    } catch (error) {
      console.error("Checkout failed", error);
    }
  };

  return (
    <div className="pos-container p-6">
      <h1 className="text-2xl font-bold mb-4">Kasir Penyewaan</h1>
      {/* ... Form Input Pelanggan, Pilih Kendaraan, Pilih Durasi ... */}
      
      <button 
        onClick={handleCheckout}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Bayar dengan Uang Digital (Midtrans)
      </button>
    </div>
  );
}
```

## 6. Mencetak Invoice
Setelah navigasi ke halaman `/cashier/invoice/:order_id`, komponen akan mengambil detail transaksi dari Backend. Kita bisa mendesain halaman tersebut khusus untuk *printing* menggunakan CSS `@media print` sehingga ketika kasir menekan `Ctrl + P` atau `window.print()`, hanya area invoice saja yang tercetak rapi tanpa sidebar/navbar.

```css
/* index.css / print.css */
@media print {
  body * {
    visibility: hidden;
  }
  #printable-invoice, #printable-invoice * {
    visibility: visible;
  }
  #printable-invoice {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none;
  }
}
```

---

> [!IMPORTANT]
> **Tindakan Anda Diperlukan:**
> Dokumen ini adalah rancangan level arsitektur. Apakah Anda ingin saya membuatkan *scaffolding* (struktur folder dasar) untuk proyek React dan Flask ini di dalam workspace Anda, atau Anda memiliki bagian spesifik (misal: implementasi enkripsi AES KTP) yang ingin didalami terlebih dahulu?
