import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { ShieldCheck } from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Administrator Profile</h1>
        <p className="text-xs text-slate-500">System administrator credentials & access privileges</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <img src={user?.avatarUrl} alt={user?.name} className="w-16 h-16 rounded-full object-cover border" />
          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mt-2">
              <ShieldCheck className="w-3 h-3" /> SUPER ADMIN
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          <p><strong>Privileges:</strong> Full system read/write access, therapist verification approvals, schedule override.</p>
          <p><strong>Last Login:</strong> {new Date().toLocaleString()}</p>
        </div>
      </Card>
    </div>
  );
};
