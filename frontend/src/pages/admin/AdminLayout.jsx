import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, Receipt, Users, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem('role') !== 'owner') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Kendaraan', path: '/admin/vehicles', icon: <Car size={20} /> },
    { name: 'Titipan (Konsinyasi)', path: '/admin/consignment', icon: <Receipt size={20} /> },
    { name: 'Transaksi', path: '/admin/transactions', icon: <Receipt size={20} /> },
    { name: 'Akun Kasir', path: '/admin/users', icon: <Users size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-2xl font-black tracking-wider text-white">RENTAL<span className="text-indigo-400">POS</span></h1>
          <p className="text-indigo-300 text-sm mt-1">Admin Panel</p>
        </div>
        
        <div className="flex-1 py-6 space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname === '/admin' && item.path === '/admin' && location.pathname.length === 6);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
