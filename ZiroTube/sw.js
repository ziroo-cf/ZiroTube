// sw.js – Cache all static assets for offline/instant loading
const CACHE_NAME = 'zirotube-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/play.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/catalog.js',
    '/js/navigation.js',
    '/js/player.js',
    // Add any static images used (e.g., logo, icons) if needed
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});