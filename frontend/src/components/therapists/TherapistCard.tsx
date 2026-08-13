import React from 'react';
import type { TherapistUser } from '../../types/user';
import { Star, MapPin, Award, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface TherapistCardProps {
  therapist: TherapistUser;
  onBookClick?: (therapist: TherapistUser) => void;
}

export const TherapistCard: React.FC<TherapistCardProps> = ({ therapist, onBookClick }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-full">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <img
            src={therapist.avatarUrl || 'https://images.unsplash.com/photo-1594824813566-88855ce78341?w=150'}
            alt={therapist.name}
            className="w-16 h-16 rounded-2xl object-cover border border-purple-100 shadow-xs shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-base font-extrabold text-slate-900 truncate">{therapist.name}</h4>
              {therapist.documentsVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  <CheckCircle className="w-3 h-3 text-purple-600" /> Verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-purple-600 truncate">{therapist.title}</p>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {therapist.rating}
              </span>
              <span>({therapist.reviewsCount} reviews)</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <Award className="w-3.5 h-3.5 text-purple-600" /> {therapist.experienceYears} yrs
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-medium">{therapist.bio}</p>

        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {therapist.specializations.map((spec) => (
            <span key={spec} className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-lg">
              {spec}
            </span>
          ))}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-4 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{therapist.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee / Session</span>
          <span className="text-sm font-black text-slate-900">₹{therapist.hourlyRate || 1200}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/parent/therapists/${therapist.id}`)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            View Profile
          </button>
          <button
            onClick={() => onBookClick && onBookClick(therapist)}
            className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
