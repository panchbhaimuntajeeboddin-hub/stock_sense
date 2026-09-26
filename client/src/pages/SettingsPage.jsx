import React from 'react';
import { Settings, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" /> Platform Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System configurations, role permissions, and API integrations.
          </p>
        </div>
        <Button variant="primary">Save Configuration</Button>
      </div>

      <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" /> API & System Preferences
        </h3>
        <Input label="Backend REST API Server URL" defaultValue="http://localhost:5000/api" />
        <Input label="Low Stock Alert Threshold Default" defaultValue="10" />
      </div>
    </div>
  );
};
