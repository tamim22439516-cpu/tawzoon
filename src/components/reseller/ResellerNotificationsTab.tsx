import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Tag,
  DollarSign,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';

export const ResellerNotificationsTab: React.FC = () => {
  const { lang, employeeToken } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    if (!employeeToken) return;
    setLoading(true);
    try {
      const data = await api.employeeGetNotifications(employeeToken);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [employeeToken]);

  const handleMarkAsRead = async (id: string) => {
    if (!employeeToken) return;
    try {
      await api.employeeMarkNotificationRead(employeeToken, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#009245]" />
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'bn' ? 'রিসেলার নোটিফিকেশন' : 'Notifications & Announcements'}
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {notifications.filter(n => !n.isRead).length} {lang === 'bn' ? 'টি নতুন' : 'unread'}
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'bn' ? 'আপাতত কোনো নোটিফিকেশন নেই।' : 'No notifications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                item.isRead
                  ? 'bg-white border-slate-100 hover:border-slate-200'
                  : 'bg-emerald-50/40 border-emerald-200/70 shadow-2xs'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#009245] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {item.type === 'COMMISSION' ? (
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                ) : item.type === 'SALE' ? (
                  <Tag className="w-4 h-4 text-sky-600" />
                ) : (
                  <Bell className="w-4 h-4 text-[#009245]" />
                )}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {lang === 'bn' ? item.titleBn : item.titleEn}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'bn' ? item.messageBn : item.messageEn}
                </p>
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-[#009245] shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
