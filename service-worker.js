// 0FluffText Service Worker - v1.3.1
const CACHE_NAME = '0FluffText-v1-3-1-cache';

// Only cache the essential assets for the modular architecture
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

// Install: Fetch and cache all files
self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('0FluffArch: Opening cache and priming assets');
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Activate: Clean up old caches from v1.2.0 and below
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); 
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('0FluffArch: Clearing legacy cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
