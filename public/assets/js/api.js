// Single place the frontend talks to the backend. Swap endpoints in config.js.
import { CONFIG } from "./config.js";
import { normalizeProduct } from "./product-model.js";
import { FALLBACK_PRODUCTS } from "./fallback-products.js";

let productsRequest = null;

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { headers: { Accept: "application/json", ...options.headers }, ...options });
  if (!res.ok) {
    // Show the server's own message (for example "Only 2 left in stock") when it sends one.
    let message = `Request failed: ${res.status}`;
    let fromServer = false;
    try {
      const body = await res.clone().json();
      if (typeof body?.error === "string") { message = body.error; fromServer = true; }
    } catch {}
    const err = new Error(message);
    err.fromServer = fromServer;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function normalizeProductList(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
  return list.map(normalizeProduct).filter((product) => product && product.active);
}

function fallbackProducts() {
  return FALLBACK_PRODUCTS.map(normalizeProduct).filter((product) => product && product.active);
}

/** All active products, falling back to the bundled sample catalogue when the source is unavailable or empty. */
export async function getProducts({ category, featured } = {}) {
  productsRequest ??= fetchJson(CONFIG.api.products)
    .then(normalizeProductList)
    .then((products) => products.length ? products : fallbackProducts())
    .catch(() => fallbackProducts());

  let products = await productsRequest;
  if (category) products = products.filter((p) => p.category === category);
  if (featured) products = products.filter((p) => p.featured);
  return products;
}

/** Later: GET /api/v1/products/{slug} */
export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) || null;
}

/**
 * Later: POST /api/v1/orders → returns the Razorpay order to open checkout with.
 * Returns { status: "unavailable" } while online payment is not integrated.
 */
export async function createOrder(payload) {
  if (!CONFIG.features.onlinePayment) return { status: "unavailable" };
  let order;
  try {
    order = await fetchJson(CONFIG.api.createOrder, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Only show messages written by our own server; anything else is a generic outage.
    if (err.fromServer) throw err;
    throw new Error("We couldn't reach the order service. No payment was taken. Please try again shortly.");
  }
  return { status: "created", order };
}

/**
 * GET /api/v1/orders/{orderNumber}/tracking
 * Expected response:
 * { orderNumber, status, updatedAt, events: [{ status, description, location, timestamp }] }
 */
export async function getOrderTracking(orderNumber) {
  if (!CONFIG.features.orderTracking) return { status: "unavailable" };
  try {
    const tracking = await fetchJson(CONFIG.api.orderTracking(orderNumber));
    return { status: "ok", tracking };
  } catch (err) {
    if (err.status === 404) return { status: "not_found" };
    throw err;
  }
}
