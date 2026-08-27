export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

type Listener = (notification: AppNotification) => void;

interface Subscription {
  id: number;
  listener: Listener;
}

export class NotificationManager {
  private listeners: Subscription[] = [];
  private nextId = 0;
  
  subscribe(listener: Listener) {
    const id = this.nextId++;
    this.listeners.push({ id, listener });
    return () => {
      this.listeners = this.listeners.filter(sub => sub.id !== id);
    };
  }

  show(message: string, type: NotificationType = 'info', duration: number = 4000) {
    const notification: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      duration
    };
    // Shallow copy the array before iterating so unsubscribing during dispatch doesn't alter the iteration
    const currentListeners = [...this.listeners];
    currentListeners.forEach(sub => sub.listener(notification));
  }
}

export const toast = new NotificationManager();
