import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h2>
        <p className="text-gray-500">Log semua transaksi penyewaan dan pembayaran.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <th className="p-4">Waktu</th>
              <th className="p-4">Order ID</th>
              <th className="p-4">Penyewa</th>
              <th className="p-4">Kendaraan</th>
              <th className="p-4">Total Pendapatan</th>
              <th className="p-4">Status Pembayaran</th>
              <th className="p-4">Status Kontrak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(t => (
              <tr key={t.id} className="text-sm hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-500">
                  <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(t.created_at).toLocaleDateString('id-ID')}</div>
                </td>
                <td className="p-4 font-mono font-medium">{t.order_id}</td>
                <td className="p-4">{t.customer_name}</td>
                <td className="p-4">{t.vehicle_name}</td>
                <td className="p-4 font-bold text-emerald-600">Rp {t.total_amount.toLocaleString('id-ID')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                    t.payment_status === 'success' ? 'bg-green-100 text-green-700' :
                    t.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>{t.payment_status}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                    t.trx_status === 'completed' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>{t.trx_status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
