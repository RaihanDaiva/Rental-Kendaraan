import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, UserPlus, Download, CheckCircle, Car } from 'lucide-react';

export default function AdminConsignment() {
  const [partners, setPartners] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);

  // Form State
  const [partnerForm, setPartnerForm] = useState({ name: '', nik: '', address: '', phone: '', bank_account: '' });
  const [contractForm, setContractForm] = useState({
    partner_id: '', plate_number: '', brand_model: '', vehicle_type: 'car', daily_rate: '',
    start_date: '', end_date: '', profit_share_partner: 70
  });

  // State for Print Preview
  const [printContract, setPrintContract] = useState(null);

  useEffect(() => {
    fetchPartners();
    fetchContracts();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/partners');
      setPartners(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchContracts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/partners/contracts');
      setContracts(res.data);
    } catch (err) { console.error(err); }
  };

  const submitPartner = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/partners', partnerForm);
      alert('Mitra berhasil ditambahkan');
      setShowPartnerForm(false);
      setPartnerForm({ name: '', nik: '', address: '', phone: '', bank_account: '' });
      fetchPartners();
    } catch (err) { 
      const errorMsg = err.response?.data?.error || 'Terjadi kesalahan pada server';
      if (errorMsg.includes('Duplicate entry')) {
        alert('Gagal! NIK tersebut sudah terdaftar sebagai mitra.');
      } else {
        alert(`Gagal menambah mitra: ${errorMsg}`);
      }
    }
  };

  const submitContract = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/partners/contracts', contractForm);
      alert(`Kontrak berhasil dibuat: ${res.data.contract_number}`);
      
      const partnerDetails = partners.find(p => p.id === Number(contractForm.partner_id));
      const newContractInfo = {
          contract_number: res.data.contract_number,
          partner_name: partnerDetails?.name,
          partner_nik: partnerDetails?.nik,
          partner_address: partnerDetails?.address,
          ...contractForm
      };
      
      setShowContractForm(false);
      setContractForm({ partner_id: '', plate_number: '', brand_model: '', vehicle_type: 'car', daily_rate: '', start_date: '', end_date: '', profit_share_partner: 70 });
      fetchContracts();
      
      // Tampilkan preview print
      setPrintContract(newContractInfo);
    } catch (err) { 
      const errorMsg = err.response?.data?.error || 'Terjadi kesalahan pada server';
      if (errorMsg.includes('Duplicate entry')) {
        alert('Gagal! Plat nomor kendaraan sudah terdaftar di sistem. Gunakan plat nomor lain.');
      } else {
        alert(`Gagal membuat kontrak: ${errorMsg}`);
      }
    }
  };

  const handlePrint = () => {
      window.print();
  };

  if (printContract) {
      return (
          <div className="bg-white p-12 max-w-4xl mx-auto shadow-lg print:shadow-none">
              <div className="no-print mb-8 flex justify-between">
                  <button onClick={() => setPrintContract(null)} className="text-gray-500 hover:text-gray-800">Kembali</button>
                  <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex gap-2 items-center"><Download size={18}/> Cetak PDF</button>
              </div>

              <div className="text-center mb-10">
                  <h1 className="text-2xl font-black mb-1 uppercase underline underline-offset-4">Perjanjian Kerja Sama Penitipan Kendaraan</h1>
                  <p className="text-gray-700 font-medium">Nomor: {printContract.contract_number}</p>
              </div>

              <div className="space-y-6 text-gray-800 leading-relaxed text-justify">
                  <p>Pada hari ini, tanggal <strong>{new Date().toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</strong>, bertempat di Bandung, yang bertanda tangan di bawah ini:</p>
                  
                  <div className="pl-6 space-y-1">
                      <table className="w-full">
                          <tbody>
                              <tr><td className="w-8 align-top">1.</td><td className="w-32 align-top">Nama</td><td className="w-4 align-top">:</td><td><strong>RENTALPOS Management</strong></td></tr>
                              <tr><td></td><td className="align-top">Alamat</td><td className="align-top">:</td><td>Jl. Raya Rental No 1, Bandung</td></tr>
                              <tr><td></td><td colSpan="3" className="pt-2 pb-4">Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</td></tr>

                              <tr><td className="w-8 align-top">2.</td><td className="w-32 align-top">Nama</td><td className="w-4 align-top">:</td><td><strong>{printContract.partner_name}</strong></td></tr>
                              <tr><td></td><td className="align-top">NIK</td><td className="align-top">:</td><td>{printContract.partner_nik}</td></tr>
                              <tr><td></td><td className="align-top">Alamat</td><td className="align-top">:</td><td>{printContract.partner_address}</td></tr>
                              <tr><td></td><td colSpan="3" className="pt-2">Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</td></tr>
                          </tbody>
                      </table>
                  </div>

                  <p>PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama selanjutnya disebut sebagai PARA PIHAK. PARA PIHAK sepakat untuk mengikatkan diri dalam Perjanjian Kerja Sama Penitipan Kendaraan (selanjutnya disebut "PKS") dengan syarat dan ketentuan sebagai berikut:</p>

                  <div>
                      <h3 className="font-bold mb-2">PASAL 1: OBJEK PERJANJIAN</h3>
                      <p>PIHAK KEDUA menitipkan kendaraan miliknya kepada PIHAK PERTAMA untuk disewakan kepada pihak lain (penyewa) dengan spesifikasi sebagai berikut:</p>
                      <table className="mt-2 ml-4">
                          <tbody>
                              <tr><td className="w-40">Merek / Model</td><td>: {printContract.brand_model}</td></tr>
                              <tr><td>Plat Nomor</td><td>: {printContract.plate_number}</td></tr>
                              <tr><td>Harga Sewa Dasar</td><td>: Rp {Number(printContract.daily_rate).toLocaleString('id-ID')} / hari</td></tr>
                          </tbody>
                      </table>
                  </div>

                  <div>
                      <h3 className="font-bold mb-2">PASAL 2: HAK DAN KEWAJIBAN</h3>
                      <ol className="list-decimal pl-5 space-y-2">
                          <li><strong>PIHAK PERTAMA</strong> berhak menyewakan kendaraan PIHAK KEDUA dan berkewajiban merawat, menjaga, serta mengelola kendaraan dengan baik selama masa PKS.</li>
                          <li><strong>PIHAK KEDUA</strong> berhak menerima pembayaran bagi hasil dan berkewajiban menyerahkan kendaraan lengkap dengan dokumen yang sah kepada PIHAK PERTAMA.</li>
                      </ol>
                  </div>

                  <div>
                      <h3 className="font-bold mb-2">PASAL 3: JANGKA WAKTU</h3>
                      <p>Perjanjian ini berlaku selama masa penitipan yang disepakati, terhitung mulai tanggal <strong>{new Date(printContract.start_date).toLocaleDateString('id-ID')}</strong> hingga tanggal <strong>{new Date(printContract.end_date).toLocaleDateString('id-ID')}</strong>, dan dapat diperpanjang atas kesepakatan PARA PIHAK.</p>
                  </div>

                  <div>
                      <h3 className="font-bold mb-2">PASAL 4: SISTEM BAGI HASIL</h3>
                      <p>Keuntungan bersih dari hasil penyewaan kendaraan akan dibagi dengan persentase: <strong>{printContract.profit_share_partner}%</strong> untuk PIHAK KEDUA, dan <strong>{100 - printContract.profit_share_partner}%</strong> untuk PIHAK PERTAMA.</p>
                  </div>

                  <div>
                      <h3 className="font-bold mb-2">PASAL 5: FORCE MAJEURE</h3>
                      <p>Apabila terjadi keadaan kahar (bencana alam, huru-hara, kebijakan pemerintah) yang menyebabkan kerugian atau rusaknya objek perjanjian, maka PARA PIHAK sepakat untuk menyelesaikannya secara musyawarah dan mufakat.</p>
                  </div>

                  <p className="mt-8">Demikian Perjanjian Kerja Sama ini dibuat dan ditandatangani oleh PARA PIHAK dalam keadaan sadar dan tanpa paksaan dari pihak manapun.</p>

                  <div className="mt-16 flex justify-between px-12">
                      <div className="text-center">
                          <p className="mb-24">PIHAK PERTAMA,</p>
                          <p className="font-bold border-t border-gray-400 pt-2 inline-block">RENTALPOS Management</p>
                      </div>
                      <div className="text-center">
                          <p className="mb-24">PIHAK KEDUA,</p>
                          <p className="font-bold border-t border-gray-400 pt-2 inline-block">{printContract.partner_name}</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Sistem Konsinyasi (Titipan)</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowPartnerForm(true)} className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-50 shadow-sm transition-all">
            <UserPlus size={18} /> Tambah Mitra
          </button>
          <button onClick={() => setShowContractForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all">
            <FileText size={18} /> Buat Kontrak Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Mitra */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UserPlus size={20} className="text-indigo-500"/> Daftar Mitra Aktif</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-y">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-600">Nama</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">No HP</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {partners.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{p.name}</td>
                      <td className="p-3 text-gray-600">{p.phone}</td>
                      <td className="p-3 text-gray-600">{p.bank_account}</td>
                    </tr>
                  ))}
                  {partners.length === 0 && (
                      <tr><td colSpan="3" className="p-4 text-center text-gray-500">Belum ada mitra terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>

        {/* Tabel Kontrak */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-emerald-500"/> Kontrak Berjalan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-y">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-600">ID Kontrak</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Kendaraan</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Bagi Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {contracts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-indigo-600">{c.contract_number}</td>
                      <td className="p-3">
                          <p className="font-medium text-gray-800">{c.vehicle_name}</p>
                          <p className="text-xs text-gray-500">{c.plate_number} • Mitra: {c.partner_name}</p>
                      </td>
                      <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-medium text-xs">{c.profit_share_partner}% Mitra</span>
                      </td>
                    </tr>
                  ))}
                  {contracts.length === 0 && (
                      <tr><td colSpan="3" className="p-4 text-center text-gray-500">Belum ada kontrak.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      {/* MODAL TAMBAH MITRA */}
      {showPartnerForm && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Registrasi Mitra Baru</h3>
            <form onSubmit={submitPartner} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" required value={partnerForm.name} onChange={e=>setPartnerForm({...partnerForm, name: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                  <input type="text" required value={partnerForm.nik} onChange={e=>setPartnerForm({...partnerForm, nik: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sesuai KTP</label>
                  <textarea required value={partnerForm.address} onChange={e=>setPartnerForm({...partnerForm, address: e.target.value})} className="w-full border p-2 rounded-lg" rows="2"></textarea>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No HP</label>
                  <input type="text" required value={partnerForm.phone} onChange={e=>setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Bank (Cth: BCA 12345)</label>
                  <input type="text" required value={partnerForm.bank_account} onChange={e=>setPartnerForm({...partnerForm, bank_account: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={()=>setShowPartnerForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Simpan Mitra</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUAT KONTRAK */}
      {showContractForm && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText/> Buat Kontrak Konsinyasi Baru</h3>
            <form onSubmit={submitContract} className="space-y-6">
              
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h4 className="font-semibold text-indigo-800 mb-3">1. Pilih Mitra (Pemilik)</h4>
                  <select required value={contractForm.partner_id} onChange={e=>setContractForm({...contractForm, partner_id: e.target.value})} className="w-full border p-2 rounded-lg bg-white">
                      <option value="">-- Pilih Mitra --</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name} - {p.nik}</option>)}
                  </select>
                  {partners.length === 0 && <p className="text-sm text-red-500 mt-2">Belum ada mitra. Silakan tambah mitra terlebih dahulu.</p>}
              </div>

              <div className="border p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">2. Data Kendaraan Titipan</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm text-gray-600 mb-1">Merek & Model</label>
                          <input type="text" required value={contractForm.brand_model} onChange={e=>setContractForm({...contractForm, brand_model: e.target.value})} placeholder="Toyota Avanza" className="w-full border p-2 rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm text-gray-600 mb-1">Plat Nomor</label>
                          <input type="text" required value={contractForm.plate_number} onChange={e=>setContractForm({...contractForm, plate_number: e.target.value})} placeholder="D 1234 ABC" className="w-full border p-2 rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm text-gray-600 mb-1">Tipe Kendaraan</label>
                          <select required value={contractForm.vehicle_type} onChange={e=>setContractForm({...contractForm, vehicle_type: e.target.value})} className="w-full border p-2 rounded-lg">
                              <option value="car">Mobil</option>
                              <option value="motorcycle">Motor</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm text-gray-600 mb-1">Harga Sewa / Hari (Rp)</label>
                          <input type="number" required value={contractForm.daily_rate} onChange={e=>setContractForm({...contractForm, daily_rate: e.target.value})} className="w-full border p-2 rounded-lg" />
                      </div>
                  </div>
              </div>

              <div className="border p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">3. Periode & Bagi Hasil</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm text-gray-600 mb-1">Tgl Mulai Kontrak</label>
                          <input type="date" required value={contractForm.start_date} onChange={e=>setContractForm({...contractForm, start_date: e.target.value})} className="w-full border p-2 rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm text-gray-600 mb-1">Tgl Selesai Kontrak</label>
                          <input type="date" required value={contractForm.end_date} onChange={e=>setContractForm({...contractForm, end_date: e.target.value})} className="w-full border p-2 rounded-lg" />
                      </div>
                      <div className="col-span-2">
                          <label className="block text-sm text-gray-600 mb-1">Persentase Bagi Hasil Mitra (%)</label>
                          <div className="flex items-center gap-4">
                              <input type="range" min="10" max="90" step="5" value={contractForm.profit_share_partner} onChange={e=>setContractForm({...contractForm, profit_share_partner: e.target.value})} className="flex-1" />
                              <div className="font-bold text-lg text-emerald-600">{contractForm.profit_share_partner}% Mitra</div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Rental akan mendapat {100 - contractForm.profit_share_partner}%</p>
                      </div>
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={()=>setShowContractForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Batal</button>
                  <button type="submit" disabled={!contractForm.partner_id} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"><CheckCircle size={18}/> Buat & Generate PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
