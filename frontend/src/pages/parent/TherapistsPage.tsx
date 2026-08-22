import React, { useState, useEffect } from 'react';
import { therapistApi } from '../../services/mockApi/therapistApi';
import { childApi } from '../../services/api/childApi';
import type { TherapistUser } from '../../types/user';
import type { Child } from '../../types/child';
import { useAuth } from '../../context/AuthContext';
import { TherapistCard } from '../../components/therapists/TherapistCard';
import { BookingModal } from '../../components/appointments/BookingModal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Search, Filter } from 'lucide-react';

export const TherapistsPage: React.FC = () => {
  const { user } = useAuth();
  const [therapists, setTherapists] = useState<TherapistUser[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState<TherapistUser | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await therapistApi.getTherapists();
      setTherapists(data.filter((t) => t.status === 'APPROVED'));

      if (user) {
        const cList = await childApi.getChildrenByParent(user.id);
        setChildrenList(cList);
      }
    };
    load();
  }, [user]);

  const filtered = therapists.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpec = specializationFilter === 'ALL' || t.specializations.includes(specializationFilter);
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Certified Therapist Directory</h1>
          <p className="text-xs text-slate-500 font-medium">Browse verified clinical specialists & reserve available session slots</p>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, specialization, location..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl border-slate-200"
          />
        </div>

        <div className="w-full sm:w-64 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <Select
            options={[
              { label: 'All Specializations', value: 'ALL' },
              { label: 'Occupational Therapy', value: 'Occupational Therapy' },
              { label: 'Speech & Language Therapy', value: 'Speech & Language Therapy' },
              { label: 'ABA Therapy', value: 'ABA Therapy' },
              { label: 'Sensory Integration', value: 'Sensory Integration' }
            ]}
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="rounded-2xl border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((therapist) => (
          <TherapistCard
            key={therapist.id}
            therapist={therapist}
            onBookClick={(t) => setSelectedTherapistForBooking(t)}
          />
        ))}
      </div>

      {selectedTherapistForBooking && (
        <BookingModal
          isOpen={!!selectedTherapistForBooking}
          onClose={() => setSelectedTherapistForBooking(null)}
          therapist={selectedTherapistForBooking}
          childrenList={childrenList}
        />
      )}
    </div>
  );
};
