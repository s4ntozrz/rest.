const CACHE_NAME = 'rast-v2-google'; // Qualquer nome diferente força a atualização
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Outfit:wght@300;400;600&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Instalação do Service Worker (Cacheia os arquivos)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Ativação (Limpa caches antigos se houver atualização)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. Intercepta requisições (Serve o cache se estiver offline)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});