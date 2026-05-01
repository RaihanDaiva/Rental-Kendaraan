import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/users/${userId}/approve`);
      fetchUsers(); // refresh data
    } catch (err) {
      alert("Gagal menyetujui user");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Akun Kasir</h2>
        <p className="text-gray-500">Kelola persetujuan (approval) pendaftaran kasir baru.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <th className="p-4">ID</th>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="text-sm hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono text-gray-500">#{u.id}</td>
                <td className="p-4 font-bold text-gray-800">{u.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                    u.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>{u.role}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                    u.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {u.status === 'pending' && (
                    <button onClick={() => handleApprove(u.id)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 inline-flex items-center gap-1 text-xs font-bold transition-colors shadow-sm">
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
  );
}
