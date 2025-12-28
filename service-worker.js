// 0FluffText Service Worker - v1.4.2
const CACHE_NAME = '0FluffText-v1-4-2-cache';

const urlsToCache = [
    './',
    'index.html',
    'engine.js',
    'app.js',
    'style.css',
    'manifest.json',
    'icon.png',
    'https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js' 
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); 
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
