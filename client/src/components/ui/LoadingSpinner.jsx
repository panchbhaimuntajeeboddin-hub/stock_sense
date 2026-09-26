import React from 'react';

export const LoadingSpinner = ({ size = 'md', label = 'Loading data...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className={`${sizeClasses[size]} border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin`} />
      {label && <p className="text-xs font-semibold text-slate-400">{label}</p>}
    </div>
  );
};
