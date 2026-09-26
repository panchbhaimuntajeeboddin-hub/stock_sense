import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Building2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
  AlertTriangle,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { path: '/reorder-predictions', label: 'AI Demand & Reorders', icon: TrendingUp },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/low-stock', label: 'Low Stock Alerts', icon: AlertTriangle },
    { path: '/receipts', label: 'Receipts', icon: ArrowDownLeft },
    { path: '/deliveries', label: 'Deliveries', icon: ArrowUpRight },
    { path: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { path: '/adjustments', label: 'Adjustments', icon: SlidersHorizontal },
    { path: '/ledger', label: 'Stock Ledger', icon: History },
    { path: '/warehouses', label: 'Warehouses', icon: Building2 },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* BRAND HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-purple-600/30 shrink-0">
              📦
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-base text-white tracking-tight leading-none">
                  Stock<span className="text-purple-400">Sense</span>
                </h1>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Enterprise IMS
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors hidden lg:block"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
