import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import POSPage from './pages/POSPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVehicles from './pages/admin/AdminVehicles';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminUsers from './pages/admin/AdminUsers';
import ReturnVehicle from './pages/ReturnVehicle';
import Invoice from './pages/Invoice';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Routes with Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        
        <Route path="/invoice/:orderId" element={<Invoice />} />
        
        <Route path="/pos" element={
          <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center no-print">
              <h1 className="text-xl font-bold tracking-wider">RENTAL<span className="text-indigo-200">POS</span></h1>
              <div className="flex items-center space-x-4">
                <a href="/return" className="text-indigo-100 hover:text-white text-sm font-medium mr-4">🔄 Pengembalian Kendaraan</a>
                <div className="flex items-center space-x-2 text-sm bg-indigo-700 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Kasir Aktif</span>
                </div>
                <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="text-sm font-medium hover:text-indigo-200 transition-colors">Logout</button>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
              <POSPage />
            </main>
          </div>
        } />

        <Route path="/return" element={
          <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center no-print">
              <h1 className="text-xl font-bold tracking-wider">RENTAL<span className="text-indigo-200">POS</span></h1>
            </header>
            <main className="flex-1 p-4 md:p-8">
              <ReturnVehicle />
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
