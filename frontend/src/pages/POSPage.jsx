import React, { useState, useEffect } from 'react';
// Tambahkan icon Camera dan Upload dari lucide-react
import { Car, CreditCard, Wallet, Banknote, CheckCircle, AlertCircle, Search, X, Camera, Upload } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function POSPage() {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  // Empty manual form
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    vehicleId: '',
    vehicleName: '',
    dailyRate: 0,
    startDate: '',
    endDate: '',
  });

  const [totalDays, setTotalDays] = useState(0);

  // --- STATE BARU UNTUK DETEKSI CASH ---
  const [cashScans, setCashScans] = useState([]);
  const [currentCashImage, setCurrentCashImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTotalDays(diffDays > 0 ? diffDays : 0);
    } else {
      setTotalDays(0);
    }
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    // Check if user is logged in
    if (!localStorage.getItem('token')) {
      // Jika error saat development, pastikan Anda sudah set token di localStorage
      // navigate('/login');
    }
  }, [navigate]);

  // Reset hasil deteksi jika ganti metode pembayaran
  useEffect(() => {
    if (paymentMethod !== 'fisik') {
      setCashScans([]);
      setCurrentCashImage(null);
    }
  }, [paymentMethod]);

  const handleDateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      vehicleId: '',
      vehicleName: '',
      dailyRate: 0
    }));
  };

  const openVehicleModal = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert("Harap isi Tanggal Mulai dan Tanggal Selesai terlebih dahulu untuk melihat ketersediaan kendaraan!");
      return;
    }
    if (totalDays <= 0) {
      alert("Tanggal Selesai harus lebih besar dari Tanggal Mulai!");
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/api/pos/vehicles/available?start_date=${formData.startDate}&end_date=${formData.endDate}`);
      setVehicles(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch available vehicles");
      alert("Gagal memuat daftar kendaraan.");
    }
  };

  const totalAmount = formData.dailyRate * totalDays;
  const totalDideteksi = cashScans.reduce((sum, scan) => {
    return scan.is_real ? sum + (Number(scan.nominal_raw) || 0) : sum;
  }, 0);

  // --- FUNGSI BARU UNTUK DETEKSI CASH ---
  const handleDetectCash = async () => {
    if (!currentCashImage) {
      alert("Silakan unggah foto uang terlebih dahulu!");
      return;
    }

    setIsDetecting(true);
    const formUpload = new FormData();
    formUpload.append('image', currentCashImage);

    try {
      const res = await axios.post('http://localhost:5000/api/pos/detect-cash', formUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCashScans(prev => [...prev, res.data]);
      setCurrentCashImage(null);
    } catch (error) {
      console.error("Deteksi uang gagal:", error);
      alert("Gagal memverifikasi uang. Pastikan server Flask berjalan.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleDigitalPayment = async (method) => {
    setIsLoading(true);
    try {
      const cashierIdRaw = localStorage.getItem('userId');
      const cashierId = cashierIdRaw && cashierIdRaw !== 'undefined' ? Number(cashierIdRaw) : null;
      const response = await axios.post('http://localhost:5000/api/pos/transactions/charge', {
          ...formData,
          vehicleId: Number(formData.vehicleId) || formData.vehicleId,
          dailyRate: Number(formData.dailyRate) || 0,
          totalDays: Number(totalDays) || 0,
          totalAmount: Number(totalAmount) || 0,
          cashierId,
          paymentType: method
      });
      
      if (response.data.status === 'success') {
        const snapToken = response.data.token;
        const orderId = response.data.order_id;
        window.snap.pay(snapToken, {
          onSuccess: async function(result){
            alert("Pembayaran Digital Berhasil! Order ID: " + result.order_id);
            try {
              await axios.post(`http://localhost:5000/api/pos/transactions/${orderId}/success`);
            } catch(e) {
              console.error('Failed to notify backend', e);
            }
            navigate(`/invoice/${orderId}`);
          },
          onPending: function(result){
            alert("Menunggu pembayaran! Silakan selesaikan pembayaran Anda.");
          },
          onError: function(result){
            alert("Pembayaran gagal! Silakan coba lagi.");
          },
          onClose: function(){
            alert("Anda menutup popup sebelum menyelesaikan pembayaran.");
          }
        });
      } else {
        alert("Gagal membuat transaksi: " + response.data.message);
      }
    } catch (error) {
      console.error("Checkout failed", error);
      const backendMessage = error.response?.data?.message || error.message || "Gagal menghubungi server pembayaran.";
      alert(`Gagal menghubungi server pembayaran. ${backendMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.vehicleId || !formData.startDate || !formData.endDate) {
      alert("Harap lengkapi semua data formulir terlebih dahulu!");
      return;
    }
    if (totalDays <= 0) {
      alert("Tanggal Selesai harus lebih besar dari Tanggal Mulai!");
      return;
    }
    if (!paymentMethod) {
      alert("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    // --- LOGIKA CHECKOUT CASH ---
    if (paymentMethod === 'fisik') {
      if (cashScans.length === 0) {
        alert("Silakan unggah dan verifikasi uang fisik terlebih dahulu.");
        return;
      }

      if (totalDideteksi < totalAmount) {
        alert(`Uang kurang! Total uang ASLI yang dideteksi hanya Rp ${totalDideteksi.toLocaleString('id-ID')}, sedangkan total bayar adalah Rp ${totalAmount.toLocaleString('id-ID')}.`);
        return;
      }

      let kembalian = totalDideteksi - totalAmount;
      if (kembalian > 0) {
        alert(`Uang kelebihan! Kembalian yang harus diberikan: Rp ${kembalian.toLocaleString('id-ID')}`);
      }
      setIsLoading(true);
      try {
        const cashierIdRaw = localStorage.getItem('userId');
        const cashierId = cashierIdRaw && cashierIdRaw !== 'undefined' ? Number(cashierIdRaw) : null;
        const response = await axios.post('http://localhost:5000/api/pos/transactions/charge', {
            ...formData,
            vehicleId: Number(formData.vehicleId) || formData.vehicleId,
            dailyRate: Number(formData.dailyRate) || 0,
            totalDays: Number(totalDays) || 0,
            totalAmount: Number(totalAmount) || 0,
            cashierId,
            paymentType: 'cash'
        });
        
        if (response.data.status === 'success') {
            alert("Pembayaran Tunai Berhasil Dicatat!");
            navigate(`/invoice/${response.data.order_id}`);
        }
      } catch (err) {
          console.error(err);
          const backendMessage = err.response?.data?.message || err.message || "Gagal memproses pembayaran tunai.";
          alert(`Gagal memproses pembayaran tunai. ${backendMessage}`);
      } finally {
          setIsLoading(false);
      }
    // --- LOGIKA CHECKOUT DIGITAL & DEBIT (MIDTRANS) ---
    // Kedua metode ini digabung karena sama-sama diproses melalui gateway Midtrans
    } else if (paymentMethod === 'debit') {
      handleDigitalPayment('debit');
    } else if (paymentMethod === 'digital') {
      handleDigitalPayment('digital');
    }
  };

  const selectVehicle = (vehicle) => {
    setFormData({
      ...formData,
      vehicleId: vehicle.id,
      vehicleName: vehicle.brand_model,
      dailyRate: vehicle.daily_rate
    });
    setShowModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      
      {/* Left Column: Form Penyewaan */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2 border-b pb-4">
            <Car className="text-indigo-500" /> Pengisian Data Penyewa
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
              <input type="text" placeholder="Cth: Budi Santoso" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
              <input type="text" placeholder="Cth: 08123456789" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={formData.startDate} onChange={e => handleDateChange('startDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
              <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={formData.endDate} onChange={e => handleDateChange('endDate', e.target.value)} />
            </div>

            {/* Vehicle Selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kendaraan</label>
              <div 
                onClick={openVehicleModal}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 cursor-pointer hover:border-indigo-500 hover:bg-white transition-all flex justify-between items-center"
              >
                <span className={formData.vehicleName ? "text-gray-800 font-medium" : "text-gray-400"}>
                  {formData.vehicleName || "Klik untuk memeriksa kendaraan yang tersedia di tanggal tersebut..."}
                </span>
                <Search size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-4">Metode Pembayaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <button 
              onClick={() => setPaymentMethod('fisik')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden ${paymentMethod === 'fisik' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {paymentMethod === 'fisik' && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full"></div>}
              <Banknote size={32} className={paymentMethod === 'fisik' ? 'text-green-500' : 'text-gray-400'} />
              <span className="font-medium">Uang Fisik (Cash)</span>
              {paymentMethod === 'fisik' && <CheckCircle size={18} className="absolute top-2 right-2 text-green-500" />}
            </button>

            <button 
              onClick={() => setPaymentMethod('debit')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'debit' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <CreditCard size={32} className={paymentMethod === 'debit' ? 'text-blue-500' : 'text-gray-400'} />
              <span className="font-medium">Kartu Debit</span>
            </button>

            <button 
              onClick={() => setPaymentMethod('digital')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden ${paymentMethod === 'digital' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {paymentMethod === 'digital' && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full"></div>}
              <Wallet size={32} className={paymentMethod === 'digital' ? 'text-indigo-500' : 'text-gray-400'} />
              <span className="font-medium text-center leading-tight">Uang Digital<br/><span className="text-xs font-normal opacity-80">(Gopay/VA)</span></span>
              {paymentMethod === 'digital' && <CheckCircle size={18} className="absolute top-2 right-2 text-indigo-500" />}
            </button>

          </div>

          {/* AREA KHUSUS DETEKSI UANG CASH (MUNCUL JIKA METODE FISIK DIPILIH) */}
          {paymentMethod === 'fisik' && (
            <div className="mt-6 p-5 border border-dashed border-green-300 bg-green-50/50 rounded-xl animate-in fade-in slide-in-from-top-4">
              <h3 className="text-green-800 font-semibold mb-3 flex items-center gap-2">
                <Camera size={18} /> Verifikasi Uang Cash
              </h3>
              {/* Tampilan Hasil History Deteksi */}
              {cashScans.length > 0 && (
                <div className="mb-6 space-y-3">
                  {cashScans.map((scan, index) => (
                    <div key={index} className={`p-4 rounded-lg border flex items-start gap-3 ${scan.is_real ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'}`}>
                      {scan.is_real ? <CheckCircle className="shrink-0 mt-0.5" /> : <AlertCircle className="shrink-0 mt-0.5" />}
                      <div>
                        <h4 className="font-bold">{scan.is_real ? `Scan ${index + 1}: Uang Asli (Rp ${Number(scan.nominal_raw || 0).toLocaleString('id-ID')})` : `Scan ${index + 1}: Peringatan Uang Palsu/Tidak Dikenal!`}</h4>
                        <p className="text-sm mt-1">{scan.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* INPUT DETEKSI UANG (MUNCUL JIKA TOTAL UANG ASLI MASIH KURANG DARI TOTAL BAYAR ATAU BELUM ADA SCAN) */}
              {(cashScans.length === 0 || totalDideteksi < totalAmount) ? (
                <div className={cashScans.length > 0 ? "pt-4 border-t border-dashed border-green-300" : ""}>
                  <p className="text-sm text-gray-600 mb-4">
                    {cashScans.length > 0 ? "Total uang asli belum mencukupi Total Bayar. Silakan unggah foto uang tambahan (Uang palsu tidak dihitung)." : "Sistem rental ini mewajibkan pengecekan keaslian uang fisik menggunakan kamera kasir. Silakan unggah foto uang yang diterima."}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1 w-full">
                      <input 
                        type="file" 
                        accept="image/*"
                        key={cashScans.length}
                        onChange={(e) => setCurrentCashImage(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer"
                      />
                    </div>
                    <button 
                      onClick={handleDetectCash}
                      disabled={!currentCashImage || isDetecting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      {isDetecting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <><Upload size={18} /> Deteksi</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-dashed border-green-300 text-center">
                  <p className="text-green-700 font-bold">Total uang fisik sudah mencukupi! Silakan lanjutkan ke Proses Pembayaran.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right Column: Ringkasan & Checkout */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-8 border border-gray-100">
          <h3 className="text-gray-800 font-bold mb-4 uppercase tracking-wider text-sm border-b border-gray-100 pb-4">Ringkasan Pembayaran</h3>
          
          <div className="space-y-4 mb-6 pt-2">
            <div className="flex justify-between items-center text-gray-600">
              <span>Sewa Kendaraan</span>
              <span className="font-medium text-gray-800">Rp {(formData.dailyRate * totalDays).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Durasi</span>
              <span className="font-medium text-gray-800">{totalDays} Hari</span>
            </div>
            <div className="h-px bg-gray-200 my-4"></div>
            <div className="flex justify-between items-end">
              <span className="text-gray-500 font-medium">Total Bayar</span>
              <span className="text-3xl font-black text-indigo-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            
            {paymentMethod === 'fisik' && cashScans.length > 0 && (
              <>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total Uang Dideteksi (AI)</span>
                  <span className="font-medium text-emerald-600">Rp {totalDideteksi.toLocaleString('id-ID')}</span>
                </div>
                {totalDideteksi > totalAmount && (
                  <div className="flex justify-between items-center text-gray-600 mt-2">
                    <span>Kembalian</span>
                    <span className="font-bold text-amber-500">Rp {(totalDideteksi - totalAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {totalDideteksi < totalAmount && (
                  <div className="flex justify-between items-center text-red-500 mt-2">
                    <span>Kekurangan</span>
                    <span className="font-bold">Rp {(totalAmount - totalDideteksi).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={!paymentMethod || isLoading || !formData.vehicleId}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 ${
              (!paymentMethod || !formData.vehicleId) 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>Proses Pembayaran</>
            )}
          </button>
        </div>
      </div>

      {/* MODAL KENDARAAN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Pilih Kendaraan Tersedia</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500 p-1 rounded-md hover:bg-red-50"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100">
              {vehicles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Car size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>Tidak ada kendaraan yang tersedia saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {vehicles.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => selectVehicle(v)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-indigo-500 transition-all group"
                    >
                      <div className="h-40 bg-gray-200 relative overflow-hidden">
                        {v.image_url ? (
                          <img src={v.image_url} alt={v.brand_model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Car size={48} /></div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                          {v.plate_number}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 line-clamp-1">{v.brand_model}</h4>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase tracking-wider">{v.vehicle_type}</span>
                        </div>
                        <div className="flex justify-between items-end border-t pt-3">
                          <span className="text-xs text-gray-500">Harga / Hari</span>
                          <span className="font-bold text-indigo-600">Rp {v.daily_rate.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}