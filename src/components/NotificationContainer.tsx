import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';

export default function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300 ${getStyles(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-sm opacity-90 mt-1">{notification.message}</p>
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="text-sm font-medium underline mt-2 hover:no-underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => notificationService.dismiss(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}