export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public show(notification: Omit<Notification, 'id'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification
    };

    this.notifications.push(newNotification);
    this.notifyListeners();

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newNotification.duration);
    }

    return id;
  }

  public success(title: string, message: string, action?: Notification['action']): string {
    return this.show({ type: 'success', title, message, action });
  }

  public error(title: string, message: string, action?: Notification['action']): string {
    return this.show({ type: 'error', title, message, duration: 8000, action });
  }

  public warning(title: string, message: string, action?: Notification['action']): string {
    return this.show({ type: 'warning', title, message, action });
  }

  public info(title: string, message: string, action?: Notification['action']): string {
    return this.show({ type: 'info', title, message, action });
  }

  public dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  public dismissAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

export const notificationService = new NotificationService();