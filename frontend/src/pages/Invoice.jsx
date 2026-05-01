import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Printer, ShieldCheck } from 'lucide-react';

// Untuk demo, kita mock get transaction details by order_id dari local active rentals atau db
// Idealnya backend membuat GET /transactions/<order_id>

export default function Invoice() {
  const { orderId } = useParams();
  
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <Link to="/pos" className="text-indigo-600 hover:underline font-medium">&larr; Kembali ke Kasir</Link>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Printer size={18} /> Cetak Kontrak & Invoice
          </button>
        </div>

        {/* PRINTABLE AREA */}
        <div id="printable-invoice" className="bg-white p-8 md:p-12 rounded-xl shadow-lg print:shadow-none print:p-0">
          <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-black text-indigo-700 tracking-wider">RENTAL<span className="text-gray-800">POS</span></h1>
              <p className="text-gray-500 mt-1">Jl. Soekarno Hatta No. 123, Bandung</p>
              <p className="text-gray-500">Telp: 0812-3456-7890</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">INVOICE & KONTRAK</h2>
              <p className="text-gray-500 mt-1">ID: <span className="font-mono">{orderId}</span></p>
              <p className="text-gray-500">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Informasi Penyewa</h3>
              <p className="text-gray-700"><strong>Sesuai data input kasir</strong></p>
              <p className="text-gray-500 italic text-sm mt-2">Data detail disembunyikan untuk privasi. Silakan periksa sistem.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Ketentuan Sewa</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Status Pembayaran: <strong>LUNAS (Midtrans)</strong></li>
                <li>• Denda Keterlambatan: <strong>Rp 50.000 / Hari</strong></li>
              </ul>
            </div>
          </div>

          {/* Terms and Conditions (Sistem Kontrak) */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
            <h3 className="font-bold text-indigo-800 flex items-center gap-2 mb-3">
              <ShieldCheck size={20} /> Syarat & Ketentuan Kontrak (Sistem)
            </h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
              <li>Penyewa bertanggung jawab penuh atas segala kerusakan, kehilangan, atau tindak pidana yang melibatkan kendaraan selama masa sewa (Rented State).</li>
              <li>Sistem akan mendeteksi batas waktu pengembalian (End Date). Jika terjadi keterlambatan, sistem otomatis mengakumulasi denda Rp 50.000 per hari keterlambatan.</li>
              <li>Kendaraan tidak boleh dipindahtangankan kepada pihak ketiga tanpa persetujuan tertulis dari pihak RentalPOS.</li>
              <li>Biaya sewa yang telah dibayarkan melalui gerbang pembayaran digital tidak dapat dikembalikan (Non-refundable).</li>
            </ol>
          </div>

          <div className="flex justify-between items-end pt-12">
            <div className="text-center w-48">
              <p className="mb-16 text-sm text-gray-600">Pihak Rental,</p>
              <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm">Petugas Kasir</p></div>
            </div>
            <div className="text-center w-48">
              <p className="mb-16 text-sm text-gray-600">Penyewa,</p>
              <div className="border-t border-gray-400 pt-2"><p className="font-bold text-sm">Nama Penyewa</p></div>
            </div>
          </div>
          
          <div className="mt-12 text-center border-t border-gray-100 pt-6 text-gray-400 text-xs">
            Dokumen ini di-generate secara otomatis oleh Sistem RentalPOS dan sah tanpa cap/stempel basah.
          </div>
        </div>
      </div>
    </div>
  );
}
