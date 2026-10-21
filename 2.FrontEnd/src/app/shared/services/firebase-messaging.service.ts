import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { firstValueFrom } from 'rxjs';
import { EnvironmentService } from '../../core/services/environment.service';
import { CommonService } from './common.service';

interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseMessagingService {
  private webMessaging: Messaging | null = null;
  private firebaseApp: FirebaseApp | null = null;
  private currentToken: string | null = null;
  private webServiceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private permissionListenerBound = false;

  constructor(
    private common: CommonService,
    private env: EnvironmentService,
    private router: Router,
  ) { }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.initWeb();
      this.isInitialized = true;
    } catch (err) {
      console.error('[FCM] initialize error:', err);
    }
  }

  private async initWeb(): Promise<void> {
    const firebaseConfig = this.env.getEnv('firebase') as FirebaseEnvConfig | null;
    if (!firebaseConfig) {
      console.warn('[FCM] No firebase config in environment');
      return;
    }

    if (!('Notification' in window)) {
      console.warn('[FCM] Notifications are not supported on this browser');
      return;
    }

    const initialPermission = Notification.permission;

    if (initialPermission === 'denied') {
      console.warn('[FCM] Notification permission is denied. Please enable notifications in browser settings for this site.');
      return;
    }

    let permission: NotificationPermission = initialPermission;
    if (initialPermission === 'default') {
      permission = await this.requestPermissionWithUserGestureFallback();
    }

    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission is not granted:', permission);
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[FCM] Service Worker is not supported on this browser');
      return;
    }

    this.firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    this.webMessaging = getMessaging(this.firebaseApp);

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    this.webServiceWorkerRegistration = swReg;

    const vapidKey = this.env.getEnv('firebaseVapidKey') as string | null;
    if (!vapidKey) {
      console.warn('[FCM] Missing firebaseVapidKey in environment');
      return;
    }

    const token = await getToken(this.webMessaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      await this.registerToken(token);
    } else {
      console.warn('[FCM] getToken returned empty token');
    }

    onMessage(this.webMessaging, (payload) => {
      this.handleForegroundNotification(
        payload.notification?.title ?? '',
        payload.notification?.body ?? '',
        payload.data as Record<string, string> | undefined,
      );
    });

    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{ type?: string; data?: Record<string, string> }>) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        this.handleNotificationTap(event.data.data);
      }
    });
  }

  private async registerToken(token: string): Promise<void> {
    if (!token || token === this.currentToken) {
      return;
    }

    this.currentToken = token;
    try {
      await firstValueFrom(this.common.post('Device/RegisterFcmToken', { token, platform: 'web' }, false));
    } catch (err) {
      console.error('[FCM] registerToken error:', err);
    }
  }

  private async requestPermissionWithUserGestureFallback(): Promise<NotificationPermission> {
    try {
      const directResult = await Notification.requestPermission();
      if (directResult !== 'default') {
        return directResult;
      }
    } catch (err) {
      console.warn('[FCM] Direct Notification.requestPermission() failed, waiting for user gesture:', err);
    }

    return this.waitForPermissionOnUserGesture();
  }

  private waitForPermissionOnUserGesture(): Promise<NotificationPermission> {
    if (Notification.permission !== 'default') {
      return Promise.resolve(Notification.permission);
    }

    if (this.permissionListenerBound) {
      return Promise.resolve(Notification.permission);
    }

    this.permissionListenerBound = true;
    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'touchstart'];

    return new Promise((resolve) => {
      const onUserGesture = async () => {
        this.removePermissionGestureListeners(events, onUserGesture);
        this.permissionListenerBound = false;

        try {
          const result = await Notification.requestPermission();
          resolve(result);
        } catch {
          resolve(Notification.permission);
        }
      };

      events.forEach((eventName) => {
        window.addEventListener(eventName, onUserGesture, { once: true, passive: true });
      });
    });
  }

  private removePermissionGestureListeners(
    events: Array<keyof WindowEventMap>,
    handler: EventListenerOrEventListenerObject,
  ): void {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handler);
    });
  }

  private handleForegroundNotification(title: string, body: string, data?: Record<string, string>): void {
    const type = data?.['type'];
    if (!type) {
      return;
    }

    if (type === 'chat' || type === 'task' || type === 'calendar' || type === 'explorer') {
      void this.showWebSystemNotification(title, body, data);
    }
  }

  private async showWebSystemNotification(title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!title && !body) {
      return;
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const registration = this.webServiceWorkerRegistration
        ?? await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
        ?? await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        body,
        icon: '/img/icon-notify.png',
        badge: '/img/icon-notify.png',
        data: data ?? {},
        tag: data?.['type'] === 'task'
          ? (data?.['boardId'] ? `task-${data['boardId']}` : 'task-general')
          : data?.['type'] === 'calendar'
            ? (data?.['eventId'] ? `calendar-${data['eventId']}` : 'calendar-general')
            : data?.['type'] === 'explorer'
              ? (data?.['itemId'] ? `explorer-${data['itemId']}` : 'explorer-general')
          : (data?.['conversationId'] ? `chat-${data['conversationId']}` : 'chat-general'),
      });
    } catch (err) {
      console.warn('[FCM] showWebSystemNotification fallback to Notification API:', err);
      this.showBrowserNotification(title, body, () => this.handleNotificationTap(data));
    }
  }

  private handleNotificationTap(data?: Record<string, string>): void {
    const type = data?.['type'];
    if (type === 'chat') {
      this.navigateToChat(data);
      return;
    }

    if (type === 'task') {
      this.navigateToTask(data);
      return;
    }

    if (type === 'calendar') {
      this.navigateToCalendar(data);
      return;
    }

    if (type === 'explorer') {
      this.navigateToExplorer(data);
    }
  }

  private navigateToChat(data?: Record<string, string>): void {
    const conversationId = data?.['conversationId'];
    if (conversationId) {
      void this.router.navigate(['/chat'], { queryParams: { id: conversationId } });
    } else {
      void this.router.navigate(['/chat']);
    }
  }

  private navigateToTask(data?: Record<string, string>): void {
    const boardId = data?.['boardId'];
    const cardId = data?.['cardId'];
    const queryParams: Record<string, string> = {};

    if (boardId) {
      queryParams['boardId'] = boardId;
    }

    if (cardId) {
      queryParams['cardId'] = cardId;
    }

    void this.router.navigate(['/task/home'], {
      queryParams: Object.keys(queryParams).length ? queryParams : undefined,
    });
  }

  private navigateToCalendar(data?: Record<string, string>): void {
    const eventId = data?.['eventId'];
    void this.router.navigate(['/calendar'], {
      queryParams: eventId ? { id: eventId } : undefined,
    });
  }

  private navigateToExplorer(data?: Record<string, string>): void {
    const itemId = data?.['itemId'];
    const parentId = data?.['parentId'];
    const queryParams: Record<string, string> = {};

    if (itemId) {
      queryParams['itemId'] = itemId;
    }

    if (parentId) {
      queryParams['parentId'] = parentId;
    }

    void this.router.navigate(['/explorer/personal'], {
      queryParams: Object.keys(queryParams).length ? queryParams : undefined,
    });
  }

  private showBrowserNotification(title: string, body: string, onClick?: () => void): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/img/icon-notify.png',
      badge: '/img/icon-notify.png',
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        notification.close();
        onClick();
      };
    }
  }

  async unregisterToken(): Promise<void> {
    if (!this.currentToken) {
      return;
    }

    try {
      await firstValueFrom(this.common.post('Device/UnregisterFcmToken', { token: this.currentToken }, false));
    } catch {
      // ignore error on logout/unload
    }

    this.currentToken = null;
  }
}
