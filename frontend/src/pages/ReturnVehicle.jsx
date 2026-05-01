import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Car, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReturnVehicle() {
  const [activeRentals, setActiveRentals] = useState([]);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
    fetchActiveRentals();
  }, [navigate]);

  const fetchActiveRentals = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pos/transactions/active');
      setActiveRentals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async () => {
    if (!actualReturnDate) {
      alert("Masukkan tanggal pengembalian aktual");
      return;
    }
    try {
      const res = await axios.post(`http://localhost:5000/api/pos/transactions/${selectedTrx.id}/return`, {
        actualReturnDate
      });
      setResult(res.data);
      setSelectedTrx(null);
      fetchActiveRentals();
    } catch (err) {
      alert("Gagal memproses pengembalian");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Car className="text-indigo-500" /> Proses Pengembalian Kendaraan
        </h2>
        <button onClick={() => navigate('/pos')} className="text-indigo-600 hover:underline font-medium">Kembali ke Kasir</button>
      </div>

      {result && (
        <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl flex flex-col items-center border border-emerald-200">
          <CheckCircle size={48} className="text-emerald-500 mb-2" />
          <h3 className="font-bold text-lg mb-2">{result.message}</h3>
          {result.overdue_days > 0 ? (
            <p className="text-center">Keterlambatan: <strong>{result.overdue_days} Hari</strong><br/>Denda yang harus dibayar: <strong>Rp {result.penalty_amount.toLocaleString('id-ID')}</strong></p>
          ) : (
            <p>Pengembalian tepat waktu. Tidak ada denda.</p>
          )}
          <button onClick={() => setResult(null)} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Tutup</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Daftar Kendaraan Disewa</h3>
          {activeRentals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tidak ada kendaraan yang sedang disewa saat ini.</p>
          ) : (
            <div className="space-y-3">
              {activeRentals.map(trx => (
                <div 
                  key={trx.id} 
                  onClick={() => setSelectedTrx(trx)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTrx?.id === trx.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">{trx.vehicle_name}</span>
                    <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded">{trx.order_id}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Penyewa: {trx.customer_name}</div>
                  <div className="text-sm text-gray-600 flex justify-between">
                    <span>Batas Kembali: <strong className="text-indigo-600">{trx.end_date}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTrx ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Detail Pengembalian</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
              <div className="flex justify-between"><span>Kendaraan</span><span className="font-bold">{selectedTrx.vehicle_name}</span></div>
              <div className="flex justify-between"><span>Penyewa</span><span className="font-bold">{selectedTrx.customer_name}</span></div>
              <div className="flex justify-between"><span>Tanggal Ambil</span><span className="font-bold">{selectedTrx.start_date}</span></div>
              <div className="flex justify-between text-indigo-700"><span>Batas Kembali</span><span className="font-bold">{selectedTrx.end_date}</span></div>
            </div>

            <div className="mb-6">
              <label className="block font-medium text-gray-700 mb-2">Pilih Tanggal Pengembalian (Aktual)</label>
              <input 
                type="date" 
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                <AlertCircle size={14} className="shrink-0" />
                Sistem kontrak akan otomatis menghitung denda keterlambatan (Rp 50.000/hari) jika tanggal ini melewati batas kembali.
              </p>
            </div>

            <button 
              onClick={handleReturn}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Proses Pengembalian
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 border-dashed flex flex-col items-center justify-center p-8 text-gray-400">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p>Pilih transaksi di samping untuk memproses pengembalian</p>
          </div>
        )}
      </div>
    </div>
  );
}
