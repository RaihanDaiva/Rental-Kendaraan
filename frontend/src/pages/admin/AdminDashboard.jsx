import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Car, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalVehicles: 0, totalTransactions: 0, totalRevenue: 0, pendingAccounts: 0 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('http://localhost:5000/api/admin/dashboard');
      setStats(statsRes.data);
      
      const chartRes = await axios.get('http://localhost:5000/api/admin/dashboard/chart');
      setChartData(chartRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Ringkasan performa penyewaan kendaraan.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600"><DollarSign size={24} /></div>
          <div><p className="text-sm text-gray-500">Pendapatan</p><p className="text-xl font-bold text-gray-800">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><Car size={24} /></div>
          <div><p className="text-sm text-gray-500">Kendaraan</p><p className="text-xl font-bold text-gray-800">{stats.totalVehicles} Unit</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Activity size={24} /></div>
          <div><p className="text-sm text-gray-500">Transaksi</p><p className="text-xl font-bold text-gray-800">{stats.totalTransactions} Total</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500">Akun Pending</p><p className="text-xl font-bold text-gray-800">{stats.pendingAccounts} Kasir</p></div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Grafik Pendapatan</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#6b7280'}} />
              <YAxis stroke="#9ca3af" tick={{fill: '#6b7280'}} tickFormatter={(value) => `Rp${value/1000}k`} />
              <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
