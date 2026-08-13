import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCheck, Circle } from 'lucide-react';

export const ParentNotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500">System updates, appointment alerts & screening reminders</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllAsRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
          Mark All Read
        </Button>
      </div>

      <Card className="p-0 overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No notifications available.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                !n.read ? 'bg-blue-50/40' : 'hover:bg-slate-50'
              }`}
            >
              {!n.read ? <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600 mt-1 shrink-0" /> : <div className="w-2.5 h-2.5 shrink-0" />}
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(n.date).toLocaleDateString()} at {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
