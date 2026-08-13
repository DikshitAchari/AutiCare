import React from 'react';
import { storageService } from '../../services/storage/storageService';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RefreshCw, Database, ShieldCheck } from 'lucide-react';

export const AdminSystemPage: React.FC = () => {
  const { showToast } = useToast();

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all system data to initial mock defaults? This will clear local changes.')) {
      storageService.resetAll();
      showToast('System data has been reset to default mock state.', 'info');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Configuration & Data Operations</h1>
        <p className="text-xs text-slate-500">Manage state reset utilities, database seeders, and platform maintenance</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Reset LocalStorage State Seeder</h3>
            <p className="text-xs text-slate-500">Purges modified browser state and restores initial mock system data</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
          This operation clears all localStorage persistent keys (<code className="text-rose-600 font-mono text-[11px]">autism_system_*</code>) including custom booked slots, registered child profiles, and submitted AI screening answers.
        </p>

        <div className="flex justify-end pt-2">
          <Button variant="danger" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={handleResetData}>
            Reset All System Mock Data
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Clinical Data Disclaimers & Compliance</h4>
            <p className="text-[11px] text-slate-500">All data processed in this web application is maintained as mock client-side state.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
