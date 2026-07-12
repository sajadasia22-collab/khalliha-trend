const CACHE_NAME = "khalliha-shell-v1";
const OFFLINE_URL = "/offline";

// Only these exact public marketing paths (or their prefixes below) may ever
// be served from cache. Everything else — including all /api/** calls and
// every (admin)/(brand)/(creator) route — must always hit the network, since
// those can carry financial or account data that must never be cached offline.
const PUBLIC_PATHS = [
  "/",
  "/campaigns",
  "/how-it-works",
  "/terms",
  "/privacy",
  "/payment-policy",
  OFFLINE_URL,
];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return pathname.startsWith("/campaigns/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever intervene in top-level page navigations. Every other request
  // (fetch() calls to /api/**, scripts, styles, images) passes straight through.
  if (request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (!isPublicPath(url.pathname)) return;

  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
});
