import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { childApi } from '../../services/api/childApi';
import type { Child } from '../../types/child';
import { AddChildModal } from '../../components/children/AddChildModal';
import { VideoUploadModal } from '../../components/video/VideoUploadModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Baby, Plus, Calendar, FileText, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChildrenPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isVideoUploadOpen, setIsVideoUploadOpen] = useState(false);

  const fetchChildren = async () => {
    if (!user) return;
    const res = await childApi.getChildrenByParent(user.id);
    setChildrenList(res);
    if (res.length > 0 && !selectedChild) {
      setSelectedChild(res[0]);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Children Directory</h1>
          <p className="text-xs text-slate-500 font-medium">Manage registered children, view profiles & screening records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsVideoUploadOpen(true)}
            leftIcon={<Video className="w-4 h-4" />}
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl"
          >
            Upload Behavior Video
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20"
          >
            Add Child Profile
          </Button>
        </div>
      </div>

      {childrenList.length === 0 ? (
        <Card className="p-8 text-center bg-slate-50 border-dashed rounded-3xl">
          <Baby className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No child profiles found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Click below to register your child's profile details.</p>
          <Button onClick={() => setIsAddOpen(true)} className="bg-purple-600 text-white rounded-xl">
            Add Child Profile
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Children Selection List */}
          <div className="space-y-3">
            {childrenList.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedChild(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedChild?.id === c.id
                    ? 'bg-purple-50/80 border-purple-500 shadow-xs ring-1 ring-purple-200'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatarUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150'}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover border border-purple-100"
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">Age {c.age} yrs • {c.gender}</p>
                  </div>
                </div>
                <StatusBadge status={c.supportIndicator} type="support" />
              </div>
            ))}
          </div>

          {/* Child Details View Pane */}
          {selectedChild && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
                <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                  <img
                    src={selectedChild.avatarUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150'}
                    alt={selectedChild.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-purple-100"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">{selectedChild.name}</h3>
                      <StatusBadge status={selectedChild.supportIndicator} type="support" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      DOB: {selectedChild.dob} • School: {selectedChild.school || 'N/A'} ({selectedChild.grade || 'N/A'})
                    </p>
                  </div>
                </div>

                <div className="py-4 space-y-4">
                  <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Parent Observations & Notes</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedChild.parentNotes || 'No notes provided.'}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <span className="text-slate-400 font-semibold block mb-1">Therapy Status</span>
                      <StatusBadge status={selectedChild.therapyStatus} type="therapy" />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <span className="text-slate-400 font-semibold block mb-1">Assigned Therapist</span>
                      <span className="font-extrabold text-slate-900 block">
                        {selectedChild.assignedTherapistName || 'None assigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsVideoUploadOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Upload Video</span>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/parent/assessment')}
                    className="rounded-xl"
                  >
                    Take Assessment
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Calendar className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/parent/therapists')}
                    className="bg-purple-600 text-white rounded-xl shadow-md shadow-purple-600/20"
                  >
                    Find Therapists
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AddChildModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchChildren}
      />

      <VideoUploadModal
        isOpen={isVideoUploadOpen}
        onClose={() => setIsVideoUploadOpen(false)}
      />
    </div>
  );
};
