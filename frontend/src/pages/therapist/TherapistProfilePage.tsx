import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { CheckCircle } from 'lucide-react';

export const TherapistProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('Pediatric occupational therapist specializing in sensory integration and early developmental intervention for children on the autism spectrum.');
  const [hourlyRate, setHourlyRate] = useState(1500);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Therapist profile updated successfully!', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Therapist Clinical Profile</h1>
        <p className="text-xs text-slate-500">Manage your practice credentials, bio, and hourly rates</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1594824813566-88855ce78341?w=150'}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover border"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  <CheckCircle className="w-3 h-3 text-teal-600" /> License Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <Input label="Full Name & Clinical Degrees" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Session Consultation Fee (₹)"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
          />
          <Textarea label="Clinical Bio & Specialization" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />

          <div className="flex justify-end pt-3">
            <Button type="submit">Save Profile Updates</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
