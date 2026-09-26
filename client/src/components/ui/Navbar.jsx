import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Bell, LogOut, User, AlertTriangle, Ban, ArrowRight } from 'lucide-react';

export const Navbar = ({ onSearchChange, searchQuery = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Live Alerts State
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ totalAlerts: 0, lowStockCount: 0, outOfStockCount: 0 });

  const fetchLiveAlerts = async () => {
    const token = localStorage.getItem('stocksense_jwt_token');
    if (!token) return;
    try {
      const res = await api.get('/alerts/low-stock');
      setAlerts(res.data.data || []);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (e) {
      // Suppress unauthenticated console errors
    }
  };

  useEffect(() => {
    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search products, SKUs, warehouses, document refs..."
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors relative"
            title="Low Stock Notifications"
          >
            <Bell className="w-4 h-4" />
            {summary.totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {summary.totalAlerts > 99 ? '99+' : summary.totalAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Stock Alerts ({summary.totalAlerts})
                </h4>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  Live DB
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    ✨ All stock levels are healthy!
                  </div>
                ) : (
                  alerts.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="font-bold text-white truncate text-xs">{a.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {a.warehouseName} • Stock: <span className="text-amber-400 font-bold">{a.currentStock}</span> (Reorder: {a.reorderLevel})
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          a.status === 'OUT_OF_STOCK'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {a.status === 'OUT_OF_STOCK' ? 'OUT' : 'LOW'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/low-stock');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                View All Low Stock Alerts ({summary.totalAlerts}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Logout Menu */}
        <div className="relative pl-2 border-l border-slate-800">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-none">{user?.name || 'User'}</p>
              <span className="text-[10px] text-purple-400 font-medium">{user?.role || 'Staff'}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in space-y-1">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
