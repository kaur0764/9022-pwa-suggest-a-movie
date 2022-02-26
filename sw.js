const version = 4;
let isOnline = true;
const staticCache = `PWA-Static-Movie-APP-${version}`;
const dynamicCache = `PWA-Dynamic-Movie-APP-${version}`;
const cacheLimit = 35;
const cacheList = [
  "/",
  "/index.html",
  "/404.html",
  "/results.html",
  "/suggest.html",
  "/css/main.css",
  "/js/app.js",
  "/manifest.json",
  "/img/android-chrome-192x192.png",
  "/img/android-chrome-512x512.png",
  "/img/apple-touch-icon.png",
  "/img/favicon-16x16.png",
  "/img/favicon-32x32.png",
  "/img/mstile-150x150.png",
  "/img/placeholder.png",
  "/img/offline.png",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(staticCache).then((cache) => {
      cache.addAll(cacheList);
    })
  );
});
self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            if (key === staticCache || key === dynamicCache) {
              return false;
            } else {
              return true;
            }
          })
          .map((key) => caches.delete(key))
      );
    })
  );
});
self.addEventListener("fetch", (ev) => {
  ev.respondWith(
    caches.match(ev.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(ev.request.url)
          .then((fetchResponse) => {
            if (fetchResponse.status > 399)
              throw new Error(fetchResponse.statusText);
            return caches.open(dynamicCache).then((cache) => {
              let copy = fetchResponse.clone();
              cache.put(ev.request, copy);
              limitCacheSize(dynamicCache, cacheLimit);
              return fetchResponse;
            });
          })
          .catch((err) => {
            console.log("SW fetch failed");
            console.warn(err);
            if (ev.request.mode == "navigate") {
              return caches.match("/404.html").then((page404Response) => {
                return page404Response;
              });
            }
          })
      );
    })
  );
});

self.addEventListener("message", (ev) => {
  //check ev.data to get the message
  if ("ONLINE" in ev.data) {
    isOnline = ev.data.ONLINE;
  }
  if ("checkOnline" in ev.data) {
    isOnline = ev.data.checkOnline;
    checkForConnection(ev);
  }
});

async function sendMessage(msg) {
  //send a message to the browser from the service worker
  await new Promise((resolve, reject) => {
    self.clients.matchAll().then(function (clients) {
      if (clients && clients.length) {
        clients[0].postMessage(msg);
      }
			resolve(true);
    });
  });
}

const limitCacheSize = (name, size = 35) => {
	//remove some files from the dynamic cache
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => {
          limitCacheSize(name, size);
        });
      }
    });
  });
};

function checkForConnection(ev) {
  let url = "/img/placeholder.png";
  let req = new Request(url, {
    method: "HEAD",
  });
  ev.waitUntil(
    fetch(req).then(
      (response) => {
        return sendMessage({ isOnline: true });
      },
      (err) => {
        return sendMessage({ isOnline: false });
      }
    )
  );
}
