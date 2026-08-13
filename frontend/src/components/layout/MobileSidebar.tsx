import React from 'react';
import { Sidebar } from './Sidebar';

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      {/* Drawer */}
      <div className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl z-10 animate-fade-in">
        <Sidebar onItemClick={onClose} />
      </div>
    </div>
  );
};
