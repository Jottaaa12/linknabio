const CACHE_NAME = 'quiz-acai-v2';
const STATIC_CACHE = 'quiz-acai-static-v2';
const DYNAMIC_CACHE = 'quiz-acai-dynamic-v2';

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './quiz.js',
    './theme.js',
    './achievements.js',
    './questions_db.js',
    './manifest.json'
];

const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    'https://i.imgur.com/d1KJ35R.jpeg'
];

// Estratégia de cache: Network First com fallback para cache
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Estratégia de cache: Cache First para assets estáticos
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        // Retornar página offline se disponível
        if (request.destination === 'document') {
            return caches.match('./offline.html');
        }
        throw error;
    }
}

// Estratégia de cache: Stale While Revalidate para recursos externos
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker instalando...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Cache estático aberto');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('Cache dinâmico aberto');
                return cache.addAll(EXTERNAL_ASSETS);
            })
        ]).then(() => {
            console.log('Todos os recursos foram cacheados');
            return self.skipWaiting();
        })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker ativando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker ativado');
            return self.clients.claim();
        })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requisições não-GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Estratégia baseada no tipo de recurso
    if (request.destination === 'document') {
        // Páginas HTML: Network First
        event.respondWith(networkFirst(request));
    } else if (request.destination === 'script' || request.destination === 'style') {
        // Scripts e CSS: Cache First
        event.respondWith(cacheFirst(request));
    } else if (request.destination === 'image') {
        // Imagens: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request));
    } else if (url.origin === location.origin) {
        // Recursos locais: Cache First
        event.respondWith(cacheFirst(request));
    } else {
        // Recursos externos: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Background Sync para sincronização offline
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sincronizar dados offline quando a conexão for restaurada
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        for (const request of requests) {
            try {
                const response = await fetch(request);
                if (response.status === 200) {
                    await cache.put(request, response);
                }
            } catch (error) {
                console.log('Erro ao sincronizar:', request.url, error);
            }
        }
    } catch (error) {
        console.log('Erro no background sync:', error);
    }
}

// Push notifications (se implementado no futuro)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Ver Quiz',
                    icon: '/icon-192x192.png'
                },
                {
                    action: 'close',
                    title: 'Fechar',
                    icon: '/icon-192x192.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Limpeza periódica de cache
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupOldCaches());
    }
});

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    
    for (const cacheName of cacheNames) {
        if (cacheName.startsWith('quiz-acai-')) {
            try {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                
                for (const request of requests) {
                    const response = await cache.match(request);
                    if (response) {
                        const date = response.headers.get('date');
                        if (date && (now - new Date(date).getTime()) > maxAge) {
                            await cache.delete(request);
                        }
                    }
                }
            } catch (error) {
                console.log('Erro ao limpar cache:', cacheName, error);
            }
        }
    }
} 
