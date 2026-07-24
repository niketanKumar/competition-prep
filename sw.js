// sw.js — HomeoPrep Service Worker for Offline PWA Support & Push Notifications
const CACHE_NAME = 'homeoprep-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/manifest.json',
  '/js/app.js',
  '/js/lib/utils.js',
  '/js/lib/supabase.js',
  '/js/lib/ai.js',
  '/js/lib/sm2.js',
  '/js/data/subjects.js',
  '/js/data/questions.js',
  '/js/data/flashcards.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// Install Event — Cache static core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[ServiceWorker] Some static assets failed to pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event — Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch Event — Stale-While-Revalidate Strategy for offline resilience
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and skip API / Gemini calls from caching
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('generativelanguage.googleapis.com')) return;

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        // Update cache dynamically if response is valid
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
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
