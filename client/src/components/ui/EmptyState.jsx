import React from 'react';
import { PackageX } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageX,
  title = 'No Data Available',
  description = 'There are currently no records found in this view.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl ${className}`}>
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-slate-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
