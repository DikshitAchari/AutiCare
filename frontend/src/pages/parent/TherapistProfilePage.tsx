import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { therapistApi } from '../../services/mockApi/therapistApi';
import { childApi } from '../../services/mockApi/childApi';
import type { TherapistUser } from '../../types/user';
import type { Child } from '../../types/child';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from '../../components/appointments/BookingModal';
import { Star, MapPin, Award, CheckCircle, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';

export const TherapistProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [therapist, setTherapist] = useState<TherapistUser | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const t = await therapistApi.getTherapistById(id);
        if (t) setTherapist(t);
      }
      if (user) {
        const cList = await childApi.getChildrenByParent(user.id);
        setChildrenList(cList);
      }
    };
    load();
  }, [id, user]);

  if (!therapist) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-800">Therapist Profile Not Found</h3>
        <Button className="mt-4" onClick={() => navigate('/parent/therapists')}>Return to Directory</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/parent/therapists')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {/* Therapist Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <img
            src={therapist.avatarUrl || 'https://images.unsplash.com/photo-1594824813566-88855ce78341?w=200'}
            alt={therapist.name}
            className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{therapist.name}</h1>
              {therapist.documentsVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Verified Credentials
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 font-medium">{therapist.title}</p>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {therapist.rating} ({therapist.reviewsCount} reviews)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Award className="w-4 h-4 text-blue-600" /> {therapist.experienceYears} Years Clinical Experience
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" /> {therapist.location}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button leftIcon={<Calendar className="w-4 h-4" />} onClick={() => setIsBookingOpen(true)}>
                Book Consultation Slot
              </Button>
              <Button variant="outline" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={() => navigate('/parent/messages')}>
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Bio & Specialization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Clinical Bio & Approach</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{therapist.bio}</p>

          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 pt-2">Areas of Specialization</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {therapist.specializations.map((s) => (
              <Badge key={s} variant="blue">{s}</Badge>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Practice Details</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Session Rate</span>
              <span className="text-base font-bold text-slate-900">₹{therapist.hourlyRate || 1200} / 45 mins</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Languages Spoken</span>
              <span className="font-semibold text-slate-700">English, Hindi</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold block text-[10px]">Clinic Location</span>
              <span className="font-semibold text-slate-700">{therapist.location}</span>
            </div>
          </div>
        </Card>
      </div>

      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          therapist={therapist}
          childrenList={childrenList}
        />
      )}
    </div>
  );
};
