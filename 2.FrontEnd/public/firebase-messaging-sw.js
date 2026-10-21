importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBN3maPenta2sONX3qwNAlOLP1kOXbTKBc',
  authDomain: 'xworkspace-d2s.firebaseapp.com',
  projectId: 'xworkspace-d2s',
  storageBucket: 'xworkspace-d2s.firebasestorage.app',
  messagingSenderId: '11584298860',
  appId: '1:11584298860:web:ce287318924859d79add49',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const title = payload?.notification?.title || data.title || 'Thong bao moi';
  const body = payload?.notification?.body || data.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/img/icon-notify.png',
    badge: '/img/icon-notify.png',
    data,
    tag: data.conversationId ? `chat-${data.conversationId}` : 'chat-general',
    renotify: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  if (data.type === 'chat' && data.conversationId) {
    url = `/chat?id=${data.conversationId}`;
  } else if (data.type === 'task') {
    const boardId = data.boardId || '';
    const cardId = data.cardId || '';
    if (boardId || cardId) {
      url = `/task/home?boardId=${encodeURIComponent(boardId)}&cardId=${encodeURIComponent(cardId)}`;
    } else {
      url = '/task/home';
    }
  } else if (data.type === 'calendar') {
    const eventId = data.eventId || '';
    url = eventId ? `/calendar?id=${encodeURIComponent(eventId)}` : '/calendar';
  } else if (data.type === 'explorer') {
    const itemId = data.itemId || '';
    const parentId = data.parentId || '';
    if (itemId || parentId) {
      const query = new URLSearchParams();
      if (itemId) query.set('itemId', itemId);
      if (parentId) query.set('parentId', parentId);
      url = `/explorer/personal?${query.toString()}`;
    } else {
      url = '/explorer/personal';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url, data });
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return undefined;
    })
  );
});
