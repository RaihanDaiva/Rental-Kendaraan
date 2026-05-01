# Rental-Kendaraan

**Notes:**
* Akun kasir:
  * Username: kasir
  * Password: kasir123

* Akun admin:
  * Username: admin
  * Password: admin123
<br>

**Langkah - langkah menjalankan website:**

1. **Persiapan Midtrans:**
   * Buat akun Midtrans di [https://midtrans.com/en](https://midtrans.com/en), lalu login.
   * Di dashboard Midtrans, pastikan **Environment** diubah dari *Production* menjadi **Sandbox**.

   ![Midtrans Sandbox Mode](https://github.com/user-attachments/assets/82732582-1e01-46f2-9fb6-f84fc57becbc)

2. **Mendapatkan API Keys:**
   * Di sidebar, masuk ke menu **Settings > Access Keys**.
   * Salin **Client Key** dan **Server Key** Anda.

   ![Midtrans Access Keys](https://github.com/user-attachments/assets/8a95cf36-e9d7-4747-b59d-aacff39a230f)

4. **Konfigurasi Environment:**
   * Di dalam folder `backend`, buat file baru bernama `.env`.
   * Salin kode di bawah ini dan isi kuncinya:
```env
# Backend Environment Variables
SECRET_KEY=supersecretkey-ganti-di-produksi
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pos_rental

# Midtrans Configuration
MIDTRANS_SERVER_KEY=[masukkan_server_key_anda]
MIDTRANS_CLIENT_KEY=[masukkan_client_key_anda]
MIDTRANS_IS_PRODUCTION=False

# Security
KTP_ENCRYPTION_KEY=W2-P6m3c_V02V2-J53lX5w6b-w7y_W1v2B8c1K4p1wA=
```

4. Import file **.sql:**
   * Import file **pos_rental_schema.sql** di database masing-masing

6. Run Backend Python:
   * Buka terminal baru untuk backend dan ketik command ini untuk run backend
```
cd backend
python app.py
```

6. Run Frontend React:
  * Buka terminal untuk frontend dan ketik command ini untuk run frontend
```
cd frontend
npm install
npm run dev
```
7. **Proses pembayaran uang digital menggunakan Midtrans:**

   * **Copy Nomor Virtual Account**
     
     ![Copy VA](https://github.com/user-attachments/assets/bf3f8c76-048f-43e6-bc3e-265e5b79a703)

   * **Buka Simulator Midtrans**
     Buka link [https://simulator.sandbox.midtrans.com/bni/va/index](https://simulator.sandbox.midtrans.com/bni/va/index) lalu masukkan nomor VA yang tadi sudah disalin.
     
     ![Input VA](https://github.com/user-attachments/assets/8c957d98-24e1-41b9-b6e5-a989c38b3670)

   * **Lakukan Pembayaran**
     Klik tombol **Pay**.
     
     ![Click Pay](https://github.com/user-attachments/assets/0842fdf0-94b3-4a52-b093-a6ddc89fb86a)

   * **Pembayaran Berhasil**
     Setelah menekan tombol, maka status pembayaran akan berubah menjadi berhasil.
     
     ![Success](https://github.com/user-attachments/assets/d3407bfa-a000-4240-9b2e-d61f91aa8c85)

