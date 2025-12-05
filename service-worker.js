const CACHE_NAME = '0FluffText-v1-1-cache';

const urlsToCache = [
    './',
    'index.html',
    'script.js',
    'style.css',
    'manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js' // External dependency added here
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); 
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
            })
        ))
    );
});
