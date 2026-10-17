// Service worker de Borracha: permite instalar la app y abrirla sin cobertura.
// Siempre intenta la red primero (para tener la última versión) y, si no hay, usa la copia guardada.
const CACHE = 'borracha-v3';
// Avisos con la app cerrada: Firebase Cloud Messaging muestra la notificación que manda el servidor
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: 'AIzaSyAn6-jJShRJX6pZhZzGsK5r2HHXRnJ_8eM', authDomain: 'borracha-93698.firebaseapp.com', projectId: 'borracha-93698',
    storageBucket: 'borracha-93698.firebasestorage.app', messagingSenderId: '574903666414', appId: '1:574903666414:web:aab8c3b3305346c08495ff'
  });
  firebase.messaging();
} catch (e) { /* sin conexión al instalar: la app funciona igual, solo sin avisos con la app cerrada */ }

const BASICOS = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png', 'icono-180.png', 'icono-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo los archivos de la propia app; Firebase, el lector de facturas, etc. van directos a la red
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});

// Al tocar una notificación se abre (o se trae al frente) la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    const abierta = lista.find(c => c.url.startsWith(self.registration.scope));
    return abierta ? abierta.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
