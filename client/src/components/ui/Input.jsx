import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
        )}
        <input
          id={inputId}
          className={`w-full py-2.5 bg-slate-950 border text-xs text-slate-100 placeholder-slate-600 rounded-xl transition-all focus:outline-none focus:ring-1 ${
            Icon ? 'pl-9 pr-4' : 'px-3.5'
          } ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-800 focus:border-purple-500 focus:ring-purple-500'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
