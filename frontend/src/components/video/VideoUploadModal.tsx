import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { childApi } from '../../services/api/childApi';
import { predictionApi } from '../../services/api/predictionApi';
import type { Child } from '../../types/child';
import { Upload, FileVideo, Sparkles } from 'lucide-react';

export interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      childApi.getChildrenByParent(user.id)
        .then((list) => {
          setChildren(list);
          if (list.length > 0) {
            setSelectedChildId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a video file first', 'warning');
      return;
    }
    if (!selectedChildId) {
      showToast('Please add or select a child profile first', 'warning');
      return;
    }

    setIsUploading(true);
    setStatusText('Uploading video & running AI4ASD neural network...');

    try {
      const result = await predictionApi.analyzeVideo(selectedChildId, selectedFile);
      showToast('AI4ASD video analysis completed successfully!', 'success');
      setSelectedFile(null);
      onClose();
      navigate('/parent/results', { state: { result } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Video analysis failed';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
      setStatusText('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Child Behavior Video" maxWidth="xl">
      <div className="space-y-6 pt-2">
        <p className="text-xs text-slate-500 font-medium">
          Upload a video clip showing your child's play or social interactions to perform AI4ASD behavior analysis.
        </p>

        {/* Child Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Target Child Profile
          </label>
          <div className="relative">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
            >
              {children.length === 0 ? (
                <option value="">No child profile found</option>
              ) : (
                children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Age {c.age} yrs)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Drag & Drop Card */}
        <div className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-3xl p-8 text-center bg-purple-50/30 hover:bg-purple-50/60 transition-all group relative cursor-pointer">
          <input
            type="file"
            accept="video/mp4,video/avi,video/quicktime,video/mov"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            disabled={isUploading}
          />

          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                <FileVideo className="w-4 h-4" /> {selectedFile.name}
              </span>
              <p className="text-[11px] text-slate-400 font-semibold">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-800">
                Drag & Drop your video here or <span className="text-purple-600 underline">Choose File</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                MP4, AVI, MOV (Max. 100MB)
              </p>
            </div>
          )}
        </div>

        {/* Progress Status Indicator */}
        {isUploading && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs font-bold text-purple-800 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
            <span>{statusText || 'Processing video analysis...'}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            onClick={handleUpload}
            isLoading={isUploading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-md shadow-purple-600/20"
          >
            {isUploading ? 'Analyzing AI Video...' : 'Analyze Video'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
