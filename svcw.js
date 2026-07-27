
const CACHE_NAME = 'hikarCache';

// TODO cache bundles and static files when app complete
const urlsToCache = [];

const cachableOnResponse = [
    '.png',
    '.json'
];

self.addEventListener('install', ev => {
    console.log("Installed the service worker");
    ev.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});


self.addEventListener('activate', ev => {
    console.log('Claiming control...');
    return self.clients.claim();
});


self.addEventListener('fetch', ev => {
    let inCache = false;
    //console.log(`Service worker intercepted: ${ev.request.url}`);
    const url = new URL(ev.request.url);
    ev.respondWith(
        caches.match(ev.request)
            .then(resp => {
                if (resp) {
                    //console.log(`This is in the service worker cache: ${url.pathname}`);
                    return resp;
                }

                //console.log(`This is NOT in the service worker cache: ${url.pathname}`);
                return fetch(ev.request)
                    .then(resp2 => {
                        let found = false;
                        if (cachableOnResponse.filter(cachableUrl => url.pathname.indexOf(cachableUrl) != -1).length > 0) {
                            //console.log('*** Caching this ***');
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(ev.request, resp2.clone());
                                    return resp2;
                                });
                        } else {
                            //console.log('Not caching this as URL does not match');
                            return resp2;
                        }
                    });
            })
    );
});