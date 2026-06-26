import React, { useEffect, useState } from 'react';
import { Bell, Clock, Check, Trash2, ShieldAlert, CheckSquare } from 'lucide-react';
import apiClient from '../services/api';
import { Notification } from '../data/mockData';
import { listenForMessages } from '../firebase/firebaseConfig';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      // GET /api/notifications
      const response = await apiClient.get('/notifications');
      if (response.data && response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notification history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Attach real-time FCM foreground listener
    listenForMessages((payload) => {
      console.log('[Notification Center] New push arrived in foreground:', payload);
      // Automatically refresh alerts
      fetchNotifications();
    });
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      // PUT /api/notifications/:id/read
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (err: any) {
      console.error('Failed to mark read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      // Mark all read locally and trigger backend updates
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => apiClient.put(`/notifications/${n.notification_id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (id: number) => {
    try {
      // DELETE /api/notifications/:id
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-450 animate-pulse">
        Fetching System Alert History...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-650 animate-pulse" /> Notification Center
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Review dispatch updates, status alterations, and comments alerts</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-xl uppercase flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <CheckSquare className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
          <span>Operating in client-side demonstration mode.</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-3xl p-16 text-center space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-sm">Inbox is Empty</h3>
          <p className="text-xs text-slate-400">You will receive system alerts when department crews make progress on your reports.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100 font-bold text-xs">
          {notifications.map((n) => (
            <div 
              key={n.notification_id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                n.is_read ? 'bg-white opacity-70' : 'bg-blue-50/20'
              }`}
            >
              
              {/* Bullet / Check Icon */}
              <button 
                onClick={() => !n.is_read && handleMarkAsRead(n.notification_id)}
                disabled={n.is_read}
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  n.is_read 
                    ? 'border-slate-200 text-slate-300 bg-slate-50' 
                    : 'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>

              {/* Message Details */}
              <div className="flex-1 space-y-1.5">
                <p className="text-slate-800 leading-relaxed font-semibold">{n.message}</p>
                
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <span className={`uppercase font-black ${n.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {n.type}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <button 
                onClick={() => handleDelete(n.notification_id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shrink-0"
                title="Delete Alert"
              >
                <Trash2 className="w-4 h-4" />
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default NotificationCenter;
