import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Printer, ShieldCheck, Car, Calendar, CreditCard } from 'lucide-react';

export default function Invoice() {
  const { orderId } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/pos/transactions/${orderId}`);
        setInvoiceData(res.data);
      } catch (err) {
        console.error("Gagal memuat detail invoice", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [orderId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat data invoice...</div>;
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Invoice tidak ditemukan</h2>
        <Link to="/pos" className="text-indigo-600 hover:underline">&larr; Kembali ke Kasir</Link>
      </div>
    );
  }

  // Untuk pembayaran digital, uang diterima sama dengan total bayar (pas) dan kembalian 0
  // Untuk pembayaran cash, ini bisa disesuaikan nanti dengan field cash_tendered dari db
  const totalAmount = invoiceData.total_amount;
  const cashTendered = totalAmount; 
  const changeAmount = cashTendered - totalAmount;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <Link to="/pos" className="text-indigo-600 hover:underline font-medium">&larr; Kembali ke Kasir</Link>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Printer size={18} /> Cetak Bukti Pembayaran
          </button>
        </div>

        {/* PRINTABLE AREA */}
        <div id="printable-invoice" className="bg-white p-8 md:p-12 rounded-xl shadow-lg print:shadow-none print:p-0">
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-black text-indigo-700 tracking-wider">RENTAL<span className="text-gray-800">POS</span></h1>
              <p className="text-gray-500 mt-1">Jl. Soekarno Hatta No. 123, Bandung</p>
              <p className="text-gray-500">Telp: 0812-3456-7890</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">BUKTI PEMBAYARAN</h2>
              <p className="text-gray-500 mt-1">No. Order: <span className="font-mono text-indigo-600 font-bold">{invoiceData.order_id}</span></p>
              <p className="text-gray-500">Tanggal Transaksi: {new Date(invoiceData.created_at).toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          {/* INFORMASI PENYEWA & KENDARAAN */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Informasi Penyewa</h3>
              <p className="text-gray-700"><span className="text-gray-500 w-24 inline-block">Nama</span> : <strong>{invoiceData.customer_name}</strong></p>
              <p className="text-gray-700"><span className="text-gray-500 w-24 inline-block">Telepon</span> : {invoiceData.customer_phone}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Metode Pembayaran</h3>
              <p className="text-gray-700 capitalize flex items-center gap-2">
                <CreditCard size={16} className="text-gray-500"/>
                {invoiceData.payment_type === 'digital' ? 'Uang Digital (Midtrans)' : invoiceData.payment_type}
              </p>
              <p className="text-green-600 font-bold flex items-center gap-2 mt-1">
                <ShieldCheck size={16} /> 
                {invoiceData.payment_status === 'success' ? 'LUNAS' : invoiceData.payment_status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* DETAIL SEWA */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 text-lg">Detail Penyewaan</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 py-3">Deskripsi</th>
                    <th className="p-4 py-3 text-center">Durasi</th>
                    <th className="p-4 py-3 text-right">Total Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-4 py-5">
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 mt-1"><Car size={20} /></div>
                        <div>
                          <p className="font-bold text-gray-800">{invoiceData.vehicle_name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Calendar size={14} />
                            <span>{new Date(invoiceData.start_date).toLocaleDateString('id-ID')} s/d {new Date(invoiceData.end_date).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-medium text-gray-700">{invoiceData.total_days} Hari</td>
                    <td className="p-4 text-right font-medium text-gray-700">Rp {invoiceData.total_amount.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* RINGKASAN PEMBAYARAN */}
          <div className="flex justify-end mb-10">
            <div className="w-1/2">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                <div className="flex justify-between mb-2 text-gray-600">
                  <span>Yang Harus Dibayar</span>
                  <span className="font-bold text-gray-800">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between mb-4 text-gray-600 border-b border-gray-200 pb-4">
                  <span>Uang Diterima / Diinput</span>
                  <span className="font-medium text-gray-800">Rp {cashTendered.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-gray-800">Kembalian</span>
                  <span className="font-black text-indigo-600">Rp {changeAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end pt-8">
            <div className="text-center w-48">
              <p className="mb-16 text-sm text-gray-600">Pihak Rental,</p>
              <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm">Petugas Kasir</p></div>
            </div>
            <div className="text-center w-48">
              <p className="mb-16 text-sm text-gray-600">Penyewa,</p>
              <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm">{invoiceData.customer_name}</p></div>
            </div>
          </div>
          
          <div className="mt-12 text-center border-t border-gray-100 pt-6 text-gray-400 text-xs">
            Terima kasih telah menyewa kendaraan di RentalPOS.<br/>
            Dokumen ini sah sebagai bukti pembayaran dan kontrak sewa.
          </div>
        </div>
      </div>
    </div>
  );
}
