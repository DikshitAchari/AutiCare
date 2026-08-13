import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ParentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState('+91 98765 43210');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile updated successfully!', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Parent Account Settings</h1>
        <p className="text-xs text-slate-500">Manage your personal profile & notification preferences</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-16 h-16 rounded-full object-cover border"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email Address" value={email} disabled helperText="Email address cannot be changed." />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="flex justify-end pt-3">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
