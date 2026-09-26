import React from 'react';
import { History } from 'lucide-react';

export const MoveHistoryPage = () => {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" /> Move History Audit Ledger Skeleton
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time Audit Log of Stock Movements.
        </p>
      </div>
    </div>
  );
};
