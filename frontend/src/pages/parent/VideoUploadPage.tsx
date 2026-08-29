import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UploadCloud, CheckCircle2, FileVideo, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { childApi } from '../../services/api/childApi';
import { predictionApi } from '../../services/api/predictionApi';
import type { Child } from '../../types/child';

export const VideoUploadPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  type UploadStage = 'idle' | 'uploading' | 'preparing' | 'analyzing' | 'saving' | 'complete';
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      childApi.getChildrenByParent(user.id)
        .then((items) => {
          setChildren(items);
          setSelectedChildId(items[0]?.id ?? '');
        })
        .catch((error) => showToast(error instanceof Error ? error.message : 'Unable to load child profiles', 'error'));
    }
  }, [user, showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const getStageMessage = () => {
    switch (uploadStage) {
      case 'uploading':
        return 'Uploading video...';
      case 'preparing':
        return 'Video uploaded. Preparing analysis...';
      case 'analyzing':
        return 'AI model is analyzing the video...';
      case 'saving':
        return 'Saving analysis result...';
      case 'complete':
        return 'Analysis complete.';
      default:
        return '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select or drag a video file first', 'warning');
      return;
    }
    if (!selectedChildId) {
      showToast('Please add or select a child profile first', 'warning');
      return;
    }
    setIsUploading(true);
    setErrorMessage(null);
    setUploadStage('uploading');

    // Discrete stage transitions based on processing milestones
    const prepTimer = setTimeout(() => setUploadStage('preparing'), 1200);
    const analyzeTimer = setTimeout(() => setUploadStage('analyzing'), 3000);

    try {
      const result = await predictionApi.analyzeVideo(selectedChildId, selectedFile);
      clearTimeout(prepTimer);
      clearTimeout(analyzeTimer);
      setUploadStage('saving');
      
      setTimeout(() => {
        setUploadStage('complete');
        showToast('AI4ASD behavior video analyzed successfully!', 'success');
        navigate(`/parent/results?id=${result.id}`, { state: { result } });
      }, 500);
    } catch (error) {
      clearTimeout(prepTimer);
      clearTimeout(analyzeTimer);
      setUploadStage('idle');
      const msg = error instanceof Error ? error.message : 'Video analysis failed';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Upload Child Behavior Video</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Upload a 30-60 second video showing your child's natural play or social behavior.
        </p>
      </div>

      {/* Main Drag & Drop Card (Screen 4 Visual Direction) */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
        <label className="block space-y-2">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Child profile</span>
          <select
            value={selectedChildId}
            onChange={(event) => setSelectedChildId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            {children.length === 0 ? (
              <option value="">No child profiles found</option>
            ) : (
              children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))
            )}
          </select>
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
            isDragOver ? 'border-purple-600 bg-purple-50/70' : 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/50'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-extrabold text-slate-800">
              Drag & Drop your video here or{' '}
              <label className="text-purple-600 font-black underline cursor-pointer hover:text-purple-700">
                Choose File
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime,video/mov"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs font-semibold text-slate-400">MP4, AVI, MOV (Max. 100MB)</p>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-white border border-purple-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-purple-900 shadow-xs">
              <FileVideo className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="truncate max-w-xs">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-400">({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
            </div>
          )}
        </div>

        {/* Bottom Bar: Tips for best results & Upload Button */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-2">
          <div className="md:col-span-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-600" /> Tips for best results:
            </h4>
            <ul className="space-y-1 text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Ensure good lighting and clear camera focus
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Clear view of the child's face, hands, and play actions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Natural behavior, avoid asking them to pose for the camera
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 flex flex-col items-end gap-3">
            {uploadStage !== 'idle' && (
              <div className="w-full p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-2 text-xs font-bold shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                <span>{getStageMessage()}</span>
              </div>
            )}
            {errorMessage && (
              <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                {errorMessage}
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full sm:w-auto px-8 py-3 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Upload & Analyze Video</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
