import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    plate_number: '',
    brand_model: '',
    vehicle_type: 'car',
    daily_rate: '',
    image_url: '',
    status: 'available'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (v = null) => {
    if (v) {
      setEditId(v.id);
      setFormData({
        plate_number: v.plate_number,
        brand_model: v.brand_model,
        vehicle_type: v.vehicle_type,
        daily_rate: v.daily_rate,
        image_url: v.image_url || '',
        status: v.status
      });
    } else {
      setEditId(null);
      setFormData({
        plate_number: '', brand_model: '', vehicle_type: 'car', daily_rate: '', image_url: '', status: 'available'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/admin/vehicles/${editId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/admin/vehicles', formData);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      alert("Gagal menyimpan kendaraan");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus kendaraan ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/vehicles/${id}`);
        fetchVehicles();
      } catch (err) {
        alert("Gagal menghapus kendaraan");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Kendaraan</h2>
          <p className="text-gray-500">Kelola master data mobil dan motor.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={20} /> Tambah Kendaraan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <th className="p-4">Info Kendaraan</th>
              <th className="p-4">Plat Nomor</th>
              <th className="p-4">Harga Sewa</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map(v => (
              <tr key={v.id} className="text-sm hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                      {v.image_url ? <img src={v.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200"></div>}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{v.brand_model}</p>
                      <p className="text-xs text-gray-500 uppercase">{v.vehicle_type}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono">{v.plate_number}</td>
                <td className="p-4 font-medium text-emerald-600">Rp {v.daily_rate.toLocaleString('id-ID')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                    v.status === 'available' ? 'bg-green-100 text-green-700' :
                    v.status === 'rented' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>{v.status}</span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleOpenModal(v)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg mr-2"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editId ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand & Model</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={formData.brand_model} onChange={e => setFormData({...formData, brand_model: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plat Nomor</label>
                  <input required type="text" className="w-full border p-2 rounded-lg" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select className="w-full border p-2 rounded-lg" value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})}>
                    <option value="car">Mobil</option>
                    <option value="motorcycle">Motor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Harian (Rp)</label>
                  <input required type="number" className="w-full border p-2 rounded-lg" value={formData.daily_rate} onChange={e => setFormData({...formData, daily_rate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border p-2 rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    {editId && <option value="rented">Rented</option>}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
