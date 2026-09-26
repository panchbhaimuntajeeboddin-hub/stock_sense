import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const normalized = String(status || '').toUpperCase();

  const statusStyles = {
    DONE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    READY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    WAITING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DRAFT: 'bg-slate-800 text-slate-400 border-slate-700',
    CANCELED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    ADMIN: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
    INVENTORY_MANAGER: 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40',
    WAREHOUSE_STAFF: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  const badgeStyle = statusStyles[normalized] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${badgeStyle} ${className}`}
    >
      {status}
    </span>
  );
};
