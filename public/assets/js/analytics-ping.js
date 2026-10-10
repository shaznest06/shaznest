const HEARTBEAT_URL = "/api/v1/analytics/ping";
const HEARTBEAT_INTERVAL_MS = 10_000;
const SESSION_KEY = "sn_analytics_tab_id_v1";

function analyticsDisabled() {
  return navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true;
}

function getTabSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function currentPage() {
  const hashRoute = location.hash.slice(1).split("?", 1)[0];
  if (hashRoute === "/admin-portal" || hashRoute === "/admin-login") return "admin";
  if (hashRoute === "/checkout") return "checkout";
  if (hashRoute === "/reviews") return "reviews";
  if (document.querySelector('[data-product-modal][open], [data-product-modal].is-open')) return "product";
  if (/^\/products\/[^/]+\/?$/.test(location.pathname) || location.pathname === "/product.html") return "product";
  if (location.pathname === "/" || location.pathname === "/index.html" || hashRoute === "/") return "home";
  return "other";
}

const tabSessionId = getTabSessionId();
let inactiveSent = false;

function ping(active, useBeacon = false) {
  if (analyticsDisabled()) return;
  const body = JSON.stringify({ sessionId: tabSessionId, page: currentPage(), active });
  if (useBeacon && navigator.sendBeacon) {
    const accepted = navigator.sendBeacon(HEARTBEAT_URL, new Blob([body], { type: "application/json" }));
    if (accepted) return;
  }
  fetch(HEARTBEAT_URL, {
    method: "POST",
    credentials: "same-origin",
    keepalive: useBeacon,
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

function markInactive() {
  if (inactiveSent) return;
  inactiveSent = true;
  ping(false, true);
}

function markActive() {
  inactiveSent = false;
  ping(true);
}

if (!analyticsDisabled()) {
  if (document.visibilityState === "visible") markActive();
  const heartbeat = window.setInterval(() => {
    if (document.visibilityState === "visible") ping(true);
  }, HEARTBEAT_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") markInactive();
    else markActive();
  });
  window.addEventListener("hashchange", () => {
    if (document.visibilityState !== "visible") return;
    if (currentPage() === "admin") markInactive();
    else markActive();
  });
  window.addEventListener("beforeunload", markInactive, { once: true });
  window.addEventListener("pagehide", () => {
    markInactive();
    clearInterval(heartbeat);
  }, { once: true });
}
