import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useLocation,
} from "react-router-dom";
import { ShoppingCart, Undo2, CircleUserRound } from "lucide-react";
import POSPage from "./pages/POSPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminConsignment from "./pages/admin/AdminConsignment";
import ReturnVehicle from "./pages/ReturnVehicle";
import Invoice from "./pages/Invoice";

function POSLayout() {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const username = localStorage.getItem("username") || "Kasir";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white flex flex-col shadow-xl no-print z-10">
        <div className="p-6 border-b border-indigo-700">
          <h1 className="text-2xl font-bold tracking-wider">
            RENTAL<span className="text-indigo-300">POS</span>
          </h1>
        </div>

        <div className="flex-1 p-4 space-y-3">
          <Link
            to="/pos"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === "/pos" ? "bg-indigo-600 font-bold" : "hover:bg-indigo-700 text-indigo-100"}`}
          >
            <ShoppingCart size={20} /> <span>Halaman POS</span>
          </Link>
          <Link
            to="/return"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === "/return" ? "bg-indigo-600 font-bold" : "hover:bg-indigo-700 text-indigo-100"}`}
          >
            <Undo2 size={20} /> <span>Pengembalian</span>
          </Link>
        </div>

        <div className="p-4 border-t border-indigo-700">
          <div className="flex items-center space-x-2 text-xs bg-indigo-900/80 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Sistem Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white px-4 md:px-8 py-4 shadow-sm no-print z-0">
          <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-gray-800">
              {location.pathname === "/pos"
                ? "Kasir (Point of Sale)"
                : "Pengembalian Kendaraan"}
            </h2>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-base font-semibold hover:text-indigo-600 transition-colors flex items-center gap-2.5 cursor-pointer bg-white px-5 py-2.5 rounded-xl"
              >
                <CircleUserRound size={24} className="text-indigo-500" /> {username}{" "}
                <span className="text-sm text-gray-400 ml-1">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = "/login";
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition-colors"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

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
          <Route path="consignment" element={<AdminConsignment />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="/invoice/:orderId" element={<Invoice />} />

        {/* POS & Return Routes wrapped in POSLayout */}
        <Route element={<POSLayout />}>
          <Route path="/pos" element={<POSPage />} />
          <Route path="/return" element={<ReturnVehicle />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
