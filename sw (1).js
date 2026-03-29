const CACHE = 'tisa-journal-v1'
const STATIC = [
  '/',
  '/index.html'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Only cache same-origin GET requests, skip Firebase/Google APIs
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.hostname.includes('firebase') || url.hostname.includes('google') || url.hostname.includes('gstatic')) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      return cached || fetchPromise
    })
  )
})
