// sw.js — HomeoPrep Service Worker for Offline PWA Support & Push Notifications
const CACHE_NAME = 'homeoprep-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/manifest.json',
  '/js/app.js',
];

// Install Event — Immediate activation
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Activate Event — Delete ALL old cache versions
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch Event — Network-First Strategy for fresh code, fallback to cache when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('generativelanguage.googleapis.com')) return;
  if (e.request.url.includes('groq.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push Notification Handler
self.addEventListener('push', (e) => {
  const data = e.data?.json() || { title: 'HomeoPrep Study Reminder ⚕️', body: 'Keep your momentum going! Time for your daily practice.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-192.png',
      tag: 'homeoprep-reminder',
      renotify: true,
      data: { url: '/' }
    })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
