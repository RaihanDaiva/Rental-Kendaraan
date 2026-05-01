import React, { useState, useEffect } from 'react';
import { Car, CreditCard, Wallet, Banknote, CheckCircle, AlertCircle, Search, X } from 'lucide-react';
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
      navigate('/login');
    }
  }, [navigate]);

  // Handle changing dates: if user changes dates, reset selected vehicle to prevent invalid booking
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

  const handleDigitalPayment = async () => {
    setIsLoading(true);
    try {
      const cashierId = localStorage.getItem('userId');
      const response = await axios.post('http://localhost:5000/api/pos/transactions/charge', { ...formData, totalAmount, totalDays, cashierId });
      
      if (response.data.status === 'success') {
        const snapToken = response.data.token;
        const orderId = response.data.order_id;
        window.snap.pay(snapToken, {
          onSuccess: async function(result){
            alert("Pembayaran Digital Berhasil! Order ID: " + result.order_id);
            // Notify backend directly since webhook might not work in local dev
            try {
              await axios.post(`http://localhost:5000/api/pos/transactions/${orderId}/success`);
            } catch(e) {
               console.error('Failed to notify backend', e);
            }
            // Redirect to invoice page
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
      alert("Gagal menghubungi server pembayaran. Pastikan backend Flask sudah berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = () => {
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

    if (paymentMethod === 'fisik') {
      alert("Memproses Pembayaran Fisik (Cash) - Ini adalah Placeholder.");
    } else if (paymentMethod === 'debit') {
      alert("Memproses Pembayaran Debit (Kartu) - Ini adalah Placeholder.");
    } else if (paymentMethod === 'digital') {
      handleDigitalPayment();
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
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'fisik' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <Banknote size={32} className={paymentMethod === 'fisik' ? 'text-green-500' : 'text-gray-400'} />
              <span className="font-medium">Uang Fisik (Cash)</span>
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
              <span className="font-medium text-center leading-tight">Uang Digital<br/><span className="text-xs font-normal opacity-80">(QRIS/Gopay/VA)</span></span>
              {paymentMethod === 'digital' && <CheckCircle size={18} className="absolute top-2 right-2 text-indigo-500" />}
            </button>

          </div>
        </div>
      </div>

      {/* Right Column: Ringkasan & Checkout */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-xl sticky top-8 border border-gray-100">
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
