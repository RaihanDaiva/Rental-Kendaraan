import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Car, DollarSign, Activity, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalVehicles: 0, totalTransactions: 0, totalRevenue: 0, pendingAccounts: 0 });
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check role
    if (localStorage.getItem('role') !== 'owner') {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('http://localhost:5000/api/admin/dashboard');
      setStats(statsRes.data);
      
      const usersRes = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/users/${userId}/approve`);
      fetchData(); // refresh data
    } catch (err) {
      alert("Gagal menyetujui user");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>
          <button onClick={handleLogout} className="text-red-500 font-medium hover:underline">Logout</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><Car size={24} /></div>
            <div><p className="text-sm text-gray-500">Total Kendaraan</p><p className="text-2xl font-bold">{stats.totalVehicles}</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600"><DollarSign size={24} /></div>
            <div><p className="text-sm text-gray-500">Total Pendapatan</p><p className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Activity size={24} /></div>
            <div><p className="text-sm text-gray-500">Total Transaksi</p><p className="text-2xl font-bold">{stats.totalTransactions}</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-amber-100 p-4 rounded-xl text-amber-600"><Users size={24} /></div>
            <div><p className="text-sm text-gray-500">Akun Pending</p><p className="text-2xl font-bold">{stats.pendingAccounts}</p></div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Manajemen Akun Kasir</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 rounded-tl-xl">ID</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="text-sm">
                    <td className="p-4">#{u.id}</td>
                    <td className="p-4 font-medium">{u.username}</td>
                    <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs uppercase">{u.role}</span></td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs uppercase ${u.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.status === 'pending' && (
                        <button onClick={() => handleApprove(u.id)} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 flex items-center gap-1 text-xs font-medium">
                          <Check size={14} /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
