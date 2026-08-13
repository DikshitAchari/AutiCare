import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { Upload, CheckCircle2, FileVideo, Sparkles } from 'lucide-react';

export interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a video file to upload', 'warning');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      showToast('Child behavior video uploaded successfully! AI analysis initiated.', 'success');
      setSelectedFile(null);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Child Behavior Video" maxWidth="xl">
      <div className="space-y-6 pt-2">
        <p className="text-xs text-slate-500">
          Upload a 30–60 second video showing your child's behavior.
        </p>

        {/* Drag & Drop Card */}
        <div className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-3xl p-8 text-center bg-purple-50/30 hover:bg-purple-50/60 transition-all group relative cursor-pointer">
          <input
            type="file"
            accept="video/mp4,video/avi,video/quicktime"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                <FileVideo className="w-4 h-4" /> {selectedFile.name}
              </span>
              <p className="text-[11px] text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
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

        {/* Tips Box */}
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2">
          <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" /> Tips for best results:
          </h4>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Ensure good lighting</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Clear view of the child's face and actions</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Natural behavior, avoid asking them to pose</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <Button
            onClick={handleUpload}
            isLoading={isUploading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-md shadow-purple-600/20"
          >
            Upload Video
          </Button>
        </div>
      </div>
    </Modal>
  );
};
