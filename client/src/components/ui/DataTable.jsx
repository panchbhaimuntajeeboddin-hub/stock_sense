import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { AlertCircle } from 'lucide-react';

export const DataTable = ({
  columns = [], // [{ header: string, accessor: string | function, render?: function }]
  data = [],
  isLoading = false,
  error = null,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no items matching your criteria.',
  onEmptyAction,
  emptyActionLabel,
  className = ''
}) => {
  if (isLoading) {
    return <LoadingSpinner label="Fetching records from server..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
        <div>
          <h4 className="font-bold text-white">Error Loading Data</h4>
          <p className="mt-0.5 opacity-90">{typeof error === 'string' ? error : error.message || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="hover:bg-slate-800/40 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render
                      ? col.render(row)
                      : typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
