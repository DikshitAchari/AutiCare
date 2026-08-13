import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, Circle } from 'lucide-react';

export const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fade-in">
      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Notifications</h4>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                !n.read ? 'bg-blue-50/40' : ''
              }`}
            >
              {!n.read ? (
                <Circle className="w-2 h-2 fill-blue-600 text-blue-600 mt-1.5 shrink-0" />
              ) : (
                <div className="w-2 h-2 shrink-0" />
              )}
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-slate-900">{n.title}</h5>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(n.date).toLocaleDateString()} at {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 px-4 text-center">
        <button onClick={onClose} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          Close
        </button>
      </div>
    </div>
  );
};
