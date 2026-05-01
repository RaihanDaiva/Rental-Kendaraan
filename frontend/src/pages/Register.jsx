import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, CheckCircle } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { username, password });
      setMessage(res.data.message);
      setError('');
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-indigo-600 mb-8">Daftar Akun Kasir</h2>
        
        {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-start gap-3"><CheckCircle size={20} className="shrink-0" /><p>{message}</p></div>}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Pilih username" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-200">
            Daftar
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-500">
          Sudah punya akun? <Link to="/login" className="text-indigo-600 hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
